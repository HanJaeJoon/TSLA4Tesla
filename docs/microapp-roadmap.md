# 마이크로앱 kit 로드맵

작성: 2026-08-20

작은 단일 목적 앱(계산기류)을 반복해서 만들기 위한 재사용 골격 `kit/`과 템플릿 저장소에 대한 결정 기록. 여러 작업 환경에서 이어서 작업하기 위한 문맥 문서다.

## 목표

**앱 1개를 만들어 출시하기까지의 소요 시간을 줄이는 것.** 개별 앱의 기능이 아니라 파이프라인이 산출물이다.

측정 지표는 **아이디어부터 Play 업로드까지 걸린 시간**이며, 첫 실측은 Phase 4에서 한다. 이후 앱에서 이 시간이 줄어드는지가 투자 회수 여부를 알려준다.

## 현재 위치

| Phase | 내용 | 상태 |
|---|---|---|
| 0-1 | EAS Build -> GitHub Actions 이전 | **완료** (`f9dbf88`) |
| 2 | TSLA4Tesla에서 `kit/` 추출 | **완료** (`523018d`) |
| - | Expo SDK 54 -> 57 업그레이드 | **완료** (Actions 빌드 성공, 실기기 확인 대기) |
| 3 | `microapp-starter` 템플릿 저장소 생성 | **로컬 완료** (GitHub 저장소 생성 대기) |
| 4 | 첫 검증 앱: 대출 상환 계산기 | **로컬 완료** (계정 작업 대기) |

SDK 57 업그레이드의 결과와 걸린 문제는 `docs/sdk-upgrade-54-to-57.md`에 기록했다. 스타터에 반영해야 할 것 3가지:

- `tsconfig.json` 에 `"types": ["jest", "node"]` - TypeScript 6 은 `@types` 를 자동 포함하지 않는다
- `react-native-google-mobile-ads` 는 `16.3.4` 고정 - GMA SDK 25.4.0 이 Kotlin 2.3 컴파일이고 RN 0.86 은 Kotlin 2.1.20 이다. SDK 57 에서도 제약이 남았다
- CI `node-version: 22` - RN 0.86 의 `engines` 하한이 `^20.19.4` 다

## kit 설계 원칙

`kit/`은 앱 도메인과 무관한 재사용 모듈이다. 규칙은 `kit/README.md`에도 적혀 있다.

**단방향 의존.** `kit/`은 `app/`, `lib/`, `components/`를 import하지 않는다. ESLint `no-restricted-imports`로 강제하며 CI의 Lint 단계에서 검사된다. 이 경계가 유지되어야 나중에 kit을 별도 패키지나 workspace로 승격할 수 있다.

**앱 고유 값은 주입받는다.** 브랜드 색, 광고 단위 ID, 앱 이름, 번역 문자열을 kit 안에 상수로 두지 않고 인자나 prop으로 받는다.

**Alert 문구는 kit에 넣지 않는다.** kit 함수는 결과만 반환하고(`saveImageToLibrary`는 `'saved' | 'denied'`) 번역된 안내는 앱이 표시한다. kit이 번역 키를 요구하면 앱마다 그 키를 강제하게 된다.

**사용처가 1개뿐인 추상화는 올리지 않는다.** 두 번째 앱에서 같은 필요가 확인되면 그때 두 사용처를 보고 승격한다.

이 원칙에 따라 **의도적으로 제외한 것**:

- 시세 스냅샷 로더 (`lib/snapshot.ts`) - 오프라인 계산기는 외부 데이터를 쓰지 않는다
- 타임아웃 붙은 `fetch` - 위와 같은 이유
- 숫자 입력 필드 컴포넌트 - 재사용될 게 거의 확실하지만 앱 1개로는 올바른 props를 정할 수 없다

## kit 구성 (2026-08-19 확정)

| 모듈 | 공개 API |
|---|---|
| `kit/theme.ts` | `ThemeColors`, `PALETTES`, `useThemeColors(overrides?)` |
| `kit/currency.ts` | `resolveTargetCurrency`, `formatCurrency(amount, locale, currency?)`, `formatKrwApprox`, `formatApproxConverted` |
| `kit/prefs.ts` | `createPrefs<T>(storageKey, isValid)` |
| `kit/i18n/` | `createI18n({translations, supportedLocales, fallbackLocale})`, `pickSupportedLocale` |
| `kit/chart/` | `decimateLabels(labels, maxCount)`, `ThemedLineChart({...})` |
| `kit/share/` | `BrandCard` (forwardRef), `useShareAvailability()`, `captureCard(ref)`, `shareImage(uri)`, `saveImageToLibrary(uri)` |
| `kit/ads/` | `AdBanner({productionUnitId?})` |

kit 테스트는 앱 코드 없이 독립 실행된다 (`npx jest kit`). 이것이 경계를 제대로 그었는지 확인하는 척도다.

## 확정된 결정

**템플릿 저장소 이름은 `microapp-starter`.** `adapp`은 `dapp`(decentralized app)으로 오독되어 쓰지 않는다. `expo-` 접두사는 계정의 저장소가 대부분 Expo 앱이라 생략했다.

**스타터는 Public, 개별 앱은 Private 권장.** Public 저장소는 GitHub Actions 분이 무제한이고, Private은 계정 전체 합산 월 2,000분을 공유한다. Android 릴리스 빌드가 약 25분이므로 Private으로는 계정 전체 월 80회가 한계다. 앱 20개를 넘어가면 재검토한다.

**접근안: 스타터 저장소 복제 방식.** 공용 npm 패키지나 모노레포는 앱이 1개인 시점에 오버엔지니어링이다. 개선이 기존 앱에 역전파되지 않는 단점이 있으나, 그 드리프트가 실제로 아파질 때(체감상 앱 3-4개) 승격한다.

**첫 검증 앱은 대출 상환 계산기.** 원리금균등 / 원금균등 / 만기일시 3종 비교. kit 모듈 전부를 사용하면서 수식이 만국공통이라 다국어 자산을 그대로 쓸 수 있다. 계산 로직의 함정은 이율 0%에서의 0 나눗셈, 반올림 누적 오차(마지막 회차 balloon adjustment), 통화별 소수점 자릿수다.

## 신규 앱 출시 시 반복 작업

앱마다 필요한 것:

- 키스토어 생성 + GitHub Secrets 4개 등록 (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`)
- 워크플로의 `EXPECTED_UPLOAD_CERT_SHA256`을 해당 앱의 업로드 키 지문으로 교체
- AdMob에 앱 추가 + 배너 광고 단위 생성
- **Play 스토어 등록정보 > 웹사이트에 도메인 입력.** AdMob이 앱별 등록정보의 도메인을 크롤링하므로 빠뜨리면 앱 인증이 실패한다
- 앱 콘텐츠 선언 (광고 ID / 광고 포함 / 데이터 보안), IARC 등급
- 출시 후 `git tag vc<N>` - versionCode 가드의 기준값
- main에서 빌드 1회 - Gradle 캐시는 저장소별이며 기본 브랜치에서만 저장된다

계정 단위라 재작업이 불필요한 것:

- `app-ads.txt` - 게시자 계정에 묶이므로 앱을 몇 개 내든 파일 하나로 커버된다
- Play 개인 개발자 계정의 비공개 테스트 요건 - 계정 단위 1회성 관문으로 보인다. 다만 신규 앱을 프로덕션에 올릴 때도 없는지는 미확인이다

## kit 역전파 대기 (2026-08-20)

스타터 복제 방식이라 개선이 기존 앱에 자동으로 퍼지지 않는다. 지금 밀려 있는 것:

- `kit/chart/ThemedLineChart.tsx` 의 `extraSeries` / `legend` / `hideDots` - loan-calculator 의 방식별 비교 차트를 위해 추가했고 `microapp-starter` 에는 반영했다. **TSLA4Tesla 의 `kit/` 에는 아직 없다.** 기존 단일 계열 사용법은 그대로 동작하므로 급하지 않다

드리프트가 실제로 아파지는 시점(체감상 앱 3-4개)에 공용 패키지로 승격하는 것이 원래 계획이다. 이 목록이 길어지는 속도가 그 시점을 알려준다.

## 로컬 저장소 위치 (2026-08-20)

GitHub 저장소가 아직 없어 로컬에만 있다.

| 저장소 | 경로 | 브랜치 |
|---|---|---|
| `microapp-starter` | `C:/JaejoonHan/01_Repositories/microapp-starter` | `main` |
| `loan-calculator` | `C:/JaejoonHan/01_Repositories/loan-calculator` | `main` |

## 참고 문서

- `docs/sdk-upgrade-54-to-57.md` - 다음 작업의 절차와 위험 지점
- `docs/release-checklist-v1.4.0.md` - v1.4.0 출시 기록과 app-ads.txt 설정
- `kit/README.md` - kit 규칙과 구성
