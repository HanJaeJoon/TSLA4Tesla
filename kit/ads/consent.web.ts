// 웹 빌드에서는 UMP 네이티브 모듈을 번들에 포함하지 않는다.
// 광고 자체가 없으므로 언제나 "판단 불가" 를 돌려주고 폼은 띄우지 않는다.
// 순수 로직(consentLogic)은 네이티브를 모르므로 그대로 재사용한다.

import { unavailableConsent, type ConsentResult, type EnsureAdsConsentOptions } from './consentLogic';

export {
  shouldRequestAds,
  type ConsentOutcome,
  type ConsentResult,
  type ConsentUnavailableReason,
  type EnsureAdsConsentOptions,
  type UnavailablePolicy,
} from './consentLogic';

const WEB_RESULT: ConsentResult = unavailableConsent('no-native-module');

export function getAdsConsentResult(): ConsentResult | null {
  return WEB_RESULT;
}

export function useAdsConsentResult(): ConsentResult | null {
  return WEB_RESULT;
}

export function usePrivacyOptionsRequired(): boolean {
  return false;
}

export function ensureAdsConsent(_options?: EnsureAdsConsentOptions): Promise<ConsentResult> {
  return Promise.resolve(WEB_RESULT);
}

export function showPrivacyOptions(): Promise<void> {
  return Promise.resolve();
}
