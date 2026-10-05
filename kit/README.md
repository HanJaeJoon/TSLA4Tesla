# kit

앱 도메인과 무관한 재사용 모듈. 광고 수익형 오프라인 계산기 앱의 공통 골격이다.

## 규칙

- `kit/`은 `app/`, `lib/`, `components/`를 **import하지 않는다.** 단방향 의존이며 ESLint로 강제한다
- 앱 고유 값(브랜드 색, 광고 단위 ID, 앱 이름, 번역 문자열)은 **인자나 prop으로 받는다.** kit 안에 상수로 두지 않는다
- 사용처가 1개뿐인 추상화는 kit에 올리지 않는다. 두 번째 앱에서 같은 필요가 확인되면 그때 승격한다

## 구성

- `i18n/` - 로케일 감지와 i18n 인스턴스 생성
- `currency.ts` - 통화/소수 포맷과 환산 대상 통화 판정 (`formatDecimal` 은 `chart/` 가 Y축 라벨에 쓴다)
- `theme.ts` - 라이트/다크 팔레트
- `prefs.ts` - AsyncStorage 기반 값 저장/복원
- `ads/` - AdMob 배너와 UMP 광고 동의
  - `ads/consentLogic.ts` - 동의 결과 해석/재시도(`backoffMs`)/디버그 옵션 정리. 네이티브를 모르는 순수 함수
  - `ads/consent.ts` - `AdsConsent` 호출 어댑터와 결과 스토어 (`consent.web.ts` 는 웹 스텁)
  - `ads/AdBanner.tsx` - `enabled` 프롭으로 동의 판정 전 배너 요청을 막는다
  - 이 앱에서는 `app/_layout.tsx` 가 `ensureAdsConsent()` 를 1회 호출하고, `app/index.tsx` 가
    배너에 `enabled={shouldRequestAds(useAdsConsentResult())}` 를 넘긴다 (판단 불가일 때의
    정책은 기본 'allow'). 문구는 kit 에 두지 않고 `lib/i18n` 에 둔다.
    공개 API 상세는 microapp-starter 의 `src/kit/README.md` 가 기준이다
- `share/` - 브랜드 카드 골격과 캡처/공유/저장
- `chart/` - 차트 라벨 처리와 테마 적용 라인 차트

## starter b25b80e 정리에서 바뀐 API

- `getAdsConsentResult()` 와 `ensureAdsConsent` 의 `maxRetries` 옵션은 없어졌다. 판정은 `useAdsConsentResult()` 로 받는다
- `consentLogic` 의 `retryDelayMs` 는 `backoffMs(n, baseMs, maxMs)` 로 바뀌었다 (n 이 0 이하면 0)
- `currency.ts` 의 `formatKrwApprox` / `formatApproxConverted` 는 이 앱 고유 표기라 `lib/currency.ts` 로 옮겼다.
  starter 에서는 `formatDecimal` 도 빠졌지만 이 앱은 `chart/ThemedLineChart.tsx` 가 쓰므로 kit 에 남겨 둔다
