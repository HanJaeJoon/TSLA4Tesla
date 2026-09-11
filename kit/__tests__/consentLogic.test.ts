import {
  interpretConsentInfo,
  resolveConsentRequest,
  retryDelayMs,
  shouldRequestAds,
  shouldRetryConsent,
  unavailableConsent,
  type AdsConsentInfoLike,
} from '../ads/consentLogic';

const info = (over: Partial<AdsConsentInfoLike> = {}): AdsConsentInfoLike => ({
  status: 'NOT_REQUIRED',
  canRequestAds: true,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  isConsentFormAvailable: false,
  ...over,
});

describe('interpretConsentInfo', () => {
  it('규제 지역이 아니면 not-required 이고 광고를 요청할 수 있다', () => {
    expect(interpretConsentInfo(info())).toEqual({
      outcome: 'not-required',
      canRequestAds: true,
      privacyOptionsRequired: false,
    });
  });

  it('동의를 받았으면 obtained 다', () => {
    const result = interpretConsentInfo(info({ status: 'OBTAINED', canRequestAds: true }));
    expect(result.outcome).toBe('obtained');
    expect(result.canRequestAds).toBe(true);
  });

  it('동의가 필요한데 못 받았으면 required 이고 canRequestAds 를 그대로 전달한다', () => {
    const result = interpretConsentInfo(
      info({ status: 'REQUIRED', canRequestAds: false, isConsentFormAvailable: true })
    );
    expect(result.outcome).toBe('required');
    expect(result.canRequestAds).toBe(false);
  });

  it('UNKNOWN 은 아직 동의를 못 받은 것으로 본다', () => {
    expect(interpretConsentInfo(info({ status: 'UNKNOWN' })).outcome).toBe('required');
  });

  it('알 수 없는 status 값도 required 로 떨어진다', () => {
    expect(interpretConsentInfo(info({ status: 'SOMETHING_NEW' })).outcome).toBe('required');
  });

  it('status 가 UNKNOWN 이어도 canRequestAds 는 SDK 값을 그대로 쓴다', () => {
    // UMP 는 동의 정보 갱신 전에도 광고 요청이 가능한 상태를 알려줄 수 있다
    const result = interpretConsentInfo(info({ status: 'UNKNOWN', canRequestAds: true }));
    expect(result.outcome).toBe('required');
    expect(result.canRequestAds).toBe(true);
  });

  it('privacyOptionsRequirementStatus 가 REQUIRED 일 때만 진입점을 노출한다', () => {
    expect(
      interpretConsentInfo(info({ privacyOptionsRequirementStatus: 'REQUIRED' }))
        .privacyOptionsRequired
    ).toBe(true);
    expect(
      interpretConsentInfo(info({ privacyOptionsRequirementStatus: 'UNKNOWN' }))
        .privacyOptionsRequired
    ).toBe(false);
  });
});

describe('unavailableConsent', () => {
  it('판단 불가를 canRequestAds true 로 둔갑시키지 않는다', () => {
    expect(unavailableConsent('no-native-module')).toEqual({
      outcome: 'unavailable',
      canRequestAds: false,
      privacyOptionsRequired: false,
      reason: 'no-native-module',
    });
  });
});

describe('shouldRequestAds', () => {
  it('아직 판정 전이면 광고를 요청하지 않는다', () => {
    expect(shouldRequestAds(null)).toBe(false);
    expect(shouldRequestAds(null, 'allow')).toBe(false);
  });

  it('동의를 받았으면 요청한다', () => {
    expect(shouldRequestAds(interpretConsentInfo(info({ status: 'OBTAINED' })))).toBe(true);
  });

  it('동의가 필요한데 못 받았으면 요청하지 않는다', () => {
    const result = interpretConsentInfo(info({ status: 'REQUIRED', canRequestAds: false }));
    expect(shouldRequestAds(result)).toBe(false);
    expect(shouldRequestAds(result, 'allow')).toBe(false);
  });

  it('판단 불가일 때는 호출부 정책을 따른다', () => {
    const result = unavailableConsent('error');
    expect(shouldRequestAds(result, 'allow')).toBe(true);
    expect(shouldRequestAds(result, 'block')).toBe(false);
    expect(shouldRequestAds(result)).toBe(true); // 기본값은 allow
  });
});

describe('shouldRetryConsent', () => {
  it('네트워크/SDK 실패는 남은 횟수만큼 재시도한다', () => {
    const result = unavailableConsent('error');
    expect(shouldRetryConsent(result, 1, 2)).toBe(true);
    expect(shouldRetryConsent(result, 2, 2)).toBe(false);
    expect(shouldRetryConsent(result, 1, 0)).toBe(false);
  });

  it('네이티브 모듈이 없는 환경은 재시도하지 않는다', () => {
    expect(shouldRetryConsent(unavailableConsent('no-native-module'), 1, 3)).toBe(false);
  });

  it('판정이 나온 결과는 재시도하지 않는다', () => {
    expect(shouldRetryConsent(interpretConsentInfo(info({ status: 'REQUIRED' })), 1, 3)).toBe(false);
    expect(shouldRetryConsent(interpretConsentInfo(info()), 1, 3)).toBe(false);
  });
});

describe('retryDelayMs', () => {
  it('지수로 늘어나되 상한을 넘지 않는다', () => {
    expect(retryDelayMs(1, 1000, 8000)).toBe(1000);
    expect(retryDelayMs(2, 1000, 8000)).toBe(2000);
    expect(retryDelayMs(3, 1000, 8000)).toBe(4000);
    expect(retryDelayMs(9, 1000, 8000)).toBe(8000);
  });
});

describe('resolveConsentRequest', () => {
  it('릴리스 빌드에서는 디버그 지오그래피와 테스트 기기를 버린다', () => {
    expect(
      resolveConsentRequest({ debugGeography: 'EEA', testDeviceIdentifiers: ['ABC'] }, false)
    ).toEqual({});
  });

  it('개발 빌드에서는 디버그 옵션을 그대로 넘긴다', () => {
    expect(
      resolveConsentRequest({ debugGeography: 'EEA', testDeviceIdentifiers: ['ABC'] }, true)
    ).toEqual({ debugGeography: 'EEA', testDeviceIdentifiers: ['ABC'] });
  });

  it('tagForUnderAgeOfConsent 는 릴리스에서도 유지한다', () => {
    expect(resolveConsentRequest({ tagForUnderAgeOfConsent: true }, false)).toEqual({
      tagForUnderAgeOfConsent: true,
    });
  });

  it('옵션이 없으면 빈 요청이다', () => {
    expect(resolveConsentRequest(undefined, true)).toEqual({});
    expect(resolveConsentRequest({ testDeviceIdentifiers: [] }, true)).toEqual({});
  });
});
