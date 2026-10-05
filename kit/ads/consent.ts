// UMP(Google User Messaging Platform) 동의 흐름.
//
// EEA/UK 등 규제 지역에 배포하려면 광고를 요청하기 전에 동의를 받아야 한다.
// 이 파일은 react-native-google-mobile-ads 의 AdsConsent 를 감싸는 얇은 어댑터이고,
// 결과 해석 규칙은 전부 consentLogic.ts(순수 함수)에 있다.
//
// 사용법은 kit/README.md 참고. 문구는 이 파일에 두지 않는다.

import { useSyncExternalStore } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import {
  backoffMs,
  interpretConsentInfo,
  resolveConsentRequest,
  shouldRetryConsent,
  unavailableConsent,
  type ConsentResult,
  type EnsureAdsConsentOptions,
} from './consentLogic';

export {
  shouldRequestAds,
  type ConsentOutcome,
  type ConsentResult,
  type ConsentUnavailableReason,
  type EnsureAdsConsentOptions,
  type UnavailablePolicy,
} from './consentLogic';

// Expo Go 에는 AdMob 네이티브 모듈이 없다 (AdBanner 와 같은 판정)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const DEFAULT_MAX_RETRIES = 2;

type GoogleMobileAds = typeof import('react-native-google-mobile-ads');

// Expo Go 에서는 모듈을 로드하는 순간 크래시가 나므로 지연 require 한다
function loadNative(): GoogleMobileAds | null {
  if (isExpoGo) return null;
  try {
    const ads =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('react-native-google-mobile-ads') as GoogleMobileAds;
    return ads.AdsConsent ? ads : null;
  } catch {
    return null;
  }
}

// --- 결과 스토어 --------------------------------------------------------
// ensureAdsConsent 의 결과를 화면들이 공유한다. 배너를 그리는 화면과
// ensureAdsConsent 를 호출하는 진입점(_layout)이 다른 트리에 있어서 필요하다.

let current: ConsentResult | null = null;
const listeners = new Set<() => void>();

function publish(result: ConsentResult) {
  current = result;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => current;

/** 마지막 동의 판정을 구독한다. 아직 판정 전이면 null */
export function useAdsConsentResult(): ConsentResult | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 설정 화면에 "광고 개인 설정" 진입점을 노출해야 하는지.
 * 규제 지역이 아니면 UMP 가 NOT_REQUIRED 를 주므로 언제나 false 다.
 */
export function usePrivacyOptionsRequired(): boolean {
  return useAdsConsentResult()?.privacyOptionsRequired === true;
}

// --- 공개 API -----------------------------------------------------------

let inFlight: Promise<ConsentResult> | null = null;

/**
 * 앱 시작 시 1회 호출한다. 동의 정보를 갱신하고 필요하면 동의 폼을 띄운 뒤
 * 결과를 돌려준다. 같은 세션에서 두 번 부르면 진행 중인 호출을 공유한다.
 *
 * 네이티브 모듈이 없거나(Expo Go/웹) UMP 호출이 실패해도 예외를 던지지 않고
 * outcome 'unavailable' 로 돌려준다. 그 경우 광고를 요청할지는 호출부가
 * shouldRequestAds(result, 'allow' | 'block') 으로 정한다.
 */
export function ensureAdsConsent(options?: EnsureAdsConsentOptions): Promise<ConsentResult> {
  if (inFlight) return inFlight;
  inFlight = runConsentFlow(options).then((result) => {
    inFlight = null;
    publish(result);
    return result;
  });
  return inFlight;
}

async function runConsentFlow(options?: EnsureAdsConsentOptions): Promise<ConsentResult> {
  const native = loadNative();
  if (!native) return unavailableConsent('no-native-module');

  let attempt = 0;
  let result = unavailableConsent('error');

  while (true) {
    attempt += 1;
    result = await gatherOnce(native, options);
    if (!shouldRetryConsent(result, attempt, DEFAULT_MAX_RETRIES)) return result;
    await sleep(backoffMs(attempt, 1000, 8000));
  }
}

async function gatherOnce(
  native: GoogleMobileAds,
  options?: EnsureAdsConsentOptions
): Promise<ConsentResult> {
  try {
    // 이름('EEA')으로 받은 디버그 지역을 SDK 의 enum 값으로 바꿔 넘긴다
    const { debugGeography: geography, ...resolved } = resolveConsentRequest(options, __DEV__);
    const debugGeography = geography
      ? native.AdsConsentDebugGeography[geography]
      : undefined;

    await native.AdsConsent.requestInfoUpdate({
      ...resolved,
      ...(debugGeography === undefined ? {} : { debugGeography }),
    });

    // 동의가 필요한 상태일 때만 폼을 띄운다 (SDK 가 알아서 판단한다)
    const info = await native.AdsConsent.loadAndShowConsentFormIfRequired();
    return interpretConsentInfo(info);
  } catch {
    return unavailableConsent('error');
  }
}

/**
 * 설정 화면의 "광고 개인 설정" 진입점. 사용자가 동의를 바꾸면 판정도 갱신한다.
 * 폼이 없거나 실패해도 예외를 던지지 않는다.
 */
export async function showPrivacyOptions(): Promise<void> {
  const native = loadNative();
  if (!native) return;
  try {
    const info = await native.AdsConsent.showPrivacyOptionsForm();
    publish(interpretConsentInfo(info));
  } catch {
    // 폼을 못 띄운 것뿐이므로 마지막 판정을 그대로 둔다.
    // 다만 동의 자체가 바뀌었을 수 있으니 캐시된 정보만 다시 읽어 본다.
    try {
      publish(interpretConsentInfo(await native.AdsConsent.getConsentInfo()));
    } catch {
      // 여기까지 실패하면 손댈 것이 없다
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
