// UMP(Google User Messaging Platform) 동의 결과를 해석하는 순수 로직.
//
// 이 파일은 react-native-google-mobile-ads 를 import 하지 않는다. 네이티브 모듈이
// 없는 환경(Jest/웹)에서도 그대로 동작해야 하고, 해석 규칙만 따로 테스트하기 위해서다.
// 네이티브 호출은 consent.ts 의 얇은 어댑터가 담당한다.

/** AdsConsentInfo 중 우리가 쓰는 필드만 구조적으로 옮긴 형태 */
export type AdsConsentInfoLike = {
  /** 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED' | 'OBTAINED' */
  status: string;
  canRequestAds: boolean;
  /** 'UNKNOWN' | 'REQUIRED' | 'NOT_REQUIRED' */
  privacyOptionsRequirementStatus: string;
  isConsentFormAvailable: boolean;
};

export type ConsentOutcome =
  /** 사용자에게 동의를 받았다 */
  | 'obtained'
  /** 규제 지역이 아니라 동의가 필요 없다 */
  | 'not-required'
  /** 동의가 필요한데 아직 못 받았다 (폼 미표시, 사용자가 닫음 등) */
  | 'required'
  /** 판단 불가 (네이티브 모듈 없음, 네트워크/SDK 실패) */
  | 'unavailable';

export type ConsentUnavailableReason =
  /** Expo Go/웹처럼 AdMob 네이티브 모듈 자체가 없는 환경 */
  | 'no-native-module'
  /** UMP SDK 호출이 실패했다 (네트워크 등). 재시도 대상 */
  | 'error';

export type ConsentResult = {
  outcome: ConsentOutcome;
  /** UMP SDK 가 알려준 값. outcome 이 'unavailable' 이면 언제나 false */
  canRequestAds: boolean;
  /** 설정 화면에 "광고 개인 설정" 진입점을 노출해야 하는지 */
  privacyOptionsRequired: boolean;
  /** outcome 이 'unavailable' 일 때만 채워진다 */
  reason?: ConsentUnavailableReason;
};

/** 판단 불가 결과. canRequestAds 를 임의로 true 로 만들지 않는다 */
export function unavailableConsent(reason: ConsentUnavailableReason): ConsentResult {
  return {
    outcome: 'unavailable',
    canRequestAds: false,
    privacyOptionsRequired: false,
    reason,
  };
}

/**
 * UMP 가 돌려준 AdsConsentInfo 를 앱이 쓰기 쉬운 결과로 옮긴다.
 *
 * status 가 UNKNOWN 인데 canRequestAds 가 true 인 경우가 있다 (동의 정보를 아직
 * 갱신하지 않았지만 광고 요청은 가능한 상태). 그래서 outcome 과 canRequestAds 를
 * 각각 따로 전달하고, 둘을 합치는 정책 판단은 shouldRequestAds 에 맡긴다.
 */
export function interpretConsentInfo(info: AdsConsentInfoLike): ConsentResult {
  return {
    outcome: toOutcome(info.status),
    canRequestAds: info.canRequestAds === true,
    privacyOptionsRequired: info.privacyOptionsRequirementStatus === 'REQUIRED',
  };
}

function toOutcome(status: string): Exclude<ConsentOutcome, 'unavailable'> {
  switch (status) {
    case 'OBTAINED':
      return 'obtained';
    case 'NOT_REQUIRED':
      return 'not-required';
    case 'REQUIRED':
      return 'required';
    default:
      // UNKNOWN 이나 알 수 없는 값은 "아직 동의를 못 받은 상태" 로 본다
      return 'required';
  }
}

/** 판단 불가일 때 광고를 요청할지에 대한 호출부 정책 */
export type UnavailablePolicy = 'allow' | 'block';

/**
 * 배너를 띄워도 되는지. 아직 결과가 없으면(null) 언제나 false 다.
 *
 * whenUnavailable 은 앱이 정한다. 네이티브 모듈이 없는 환경에서는 어차피 배너가
 * 렌더되지 않으므로 'allow' 가 무해하지만, 규제 지역 비중이 큰 앱은 'block' 을
 * 골라 UMP 응답 실패 시 광고를 아예 띄우지 않을 수 있다.
 */
export function shouldRequestAds(
  result: ConsentResult | null,
  whenUnavailable: UnavailablePolicy = 'allow'
): boolean {
  if (!result) return false;
  if (result.outcome === 'unavailable') return whenUnavailable === 'allow';
  return result.canRequestAds;
}

/**
 * 재시도할지. 네트워크/SDK 실패('error')만 재시도 대상이다.
 * 네이티브 모듈이 없는 환경은 몇 번을 불러도 결과가 같으므로 재시도하지 않는다.
 */
export function shouldRetryConsent(
  result: ConsentResult,
  attempt: number,
  maxAttempts: number
): boolean {
  if (result.outcome !== 'unavailable') return false;
  if (result.reason !== 'error') return false;
  return attempt < maxAttempts;
}

/** 재시도 간격 (지수 백오프, 상한 있음) */
export function retryDelayMs(attempt: number, baseMs = 1000, maxMs = 8000): number {
  const delay = baseMs * 2 ** Math.max(0, attempt - 1);
  return Math.min(delay, maxMs);
}

export type DebugGeographyName = 'DISABLED' | 'EEA' | 'REGULATED_US_STATE' | 'OTHER';

export type EnsureAdsConsentOptions = {
  /** 개발 빌드에서 EEA 사용자인 척 테스트할 때. 릴리스 빌드에서는 무시된다 */
  debugGeography?: DebugGeographyName;
  /** UMP 테스트 기기 ID 목록. 릴리스 빌드에서는 무시된다 */
  testDeviceIdentifiers?: string[];
  /** 미성년자 대상 태그 (릴리스에서도 적용된다) */
  tagForUnderAgeOfConsent?: boolean;
  /** 'error' 로 실패했을 때 추가 시도 횟수 */
  maxRetries?: number;
};

export type ResolvedConsentRequest = {
  debugGeography?: DebugGeographyName;
  testDeviceIdentifiers?: string[];
  tagForUnderAgeOfConsent?: boolean;
};

/**
 * 디버그 옵션은 개발 빌드에서만 살린다. 릴리스에 debugGeography 가 섞이면
 * 실사용자에게 잘못된 지역 기준의 동의 폼이 뜬다.
 */
export function resolveConsentRequest(
  options: EnsureAdsConsentOptions | undefined,
  isDev: boolean
): ResolvedConsentRequest {
  const resolved: ResolvedConsentRequest = {};
  if (options?.tagForUnderAgeOfConsent !== undefined) {
    resolved.tagForUnderAgeOfConsent = options.tagForUnderAgeOfConsent;
  }
  if (!isDev) return resolved;
  if (options?.debugGeography) resolved.debugGeography = options.debugGeography;
  if (options?.testDeviceIdentifiers?.length) {
    resolved.testDeviceIdentifiers = options.testDeviceIdentifiers;
  }
  return resolved;
}
