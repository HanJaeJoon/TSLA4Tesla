# 광고 수익형 앱 양산 파이프라인 설계 (adapp-kit)

작성: 2026-08-19
상태: 설계 확정, 구현 계획 수립 전
브랜치: `dev/jjhan-adapp-kit`

## 1. 배경과 목표

TSLA4Tesla v1.4.0 출시로 "Expo 앱 1개를 Play 프로덕션까지 올리는" 전 과정을 한 번 완주했다. 다음 목표는 **광고 수익 확대**이며, 전략은 롤모델(https://soulduse.tistory.com/)의 검증된 방식인 **다량 출시**를 따른다.

### 롤모델 조사 결과 (2026-08-19 확인)

- 7-8년간 개인 앱 300-400개 출시. 2023년 2월 이후 1.5년에 300개 집중
- 수익 계단: 첫 앱 하루 $1 -> 앱 50-60개에서 하루 $100 -> 150개에서 월급 초과 -> 300개에서 퇴사
- 개별 앱 분포는 극단적: 대다수 유저 0명, 일부 하루 $1, 가끔 $10, 드물게 $50
- 대표 사례 "글자수 세기": 기획-개발-배포 1시간 미만, 이후 4년간 하루 $0.1-0.2
- 앱 500개 이상이 공용 서버 1대에 연결 (인프라 레버리지)

핵심 해석: 이 전략의 자산은 앱 개수가 아니라 **앱 1개당 출시 소요 시간을 극단적으로 줄인 파이프라인**이다. 따라서 다음 작업은 "2번째 앱"이 아니라 **재사용 가능한 템플릿(kit)의 구축과 검증**이다.

### 성공 지표

**아이디어부터 Play 프로덕션 업로드까지 걸린 시간.**

Phase 4에서 실측하고, 그 다음 앱에서 얼마나 줄어드는지가 이 투자의 회수 여부를 알려준다. 롤모델의 1시간은 앱 300개 이후의 숫자이므로 첫 검증 앱의 목표치가 아니다.

## 2. 저장소 구성

| 저장소 | 시점 | 역할 |
|---|---|---|
| `TSLA4Tesla` (기존) | Phase 0-2 | kit이 태어나는 곳. 리팩터링 안전망(기존 테스트)이 있음 |
| `expo-adapp-starter` (신규) | Phase 3 | 템플릿 저장소. 검증된 kit의 최종 집. 신규 앱은 여기서 클론 |
| 앱별 저장소 (신규) | Phase 4~ | 스타터에서 클론한 개별 앱 |

kit은 TSLA4Tesla 안에서 만들어지고 검증되지만, 템플릿으로서의 집은 `expo-adapp-starter`다. 이후 TSLA4Tesla는 "kit을 쓰는 앱 중 하나"로 남는다.

### kit을 TSLA4Tesla 안에서 먼저 만드는 이유

1. `app/index.tsx` 999줄 리팩터링의 회귀 안전망이 기존 테스트 7개 파일이다. 새 저장소로 복사한 뒤 리팩터링하면 회귀를 잡아줄 것이 없다.
2. 이렇게 하면 kit의 소비자가 1개가 아니라 2개(TSLA4Tesla + 대출 계산기)가 된다. 사용처가 하나뿐인 추상화는 거의 항상 틀린 인터페이스로 굳는다.

## 3. 접근안 선택

검토한 3안:

- **A. 스타터 저장소** - 클론해서 시작. 도구 0개. 개선이 기존 앱에 역전파되지 않음
- **B. 공용 npm 패키지** - 전파력 최고. 배포 파이프라인/버전 관리가 선불 비용
- **C. 모노레포(workspaces)** - 전파 + 원자적 리팩터링. 앱이 늘수록 저장소가 무거움

**선택: A.** 앱이 1개인 현 시점에 B/C는 오버엔지니어링이다.

단, `kit/`을 **단방향 의존**(앱은 kit을 import하지만 kit은 앱을 모름)으로 격리해 나중에 디렉터리째 패키지/workspace로 승격 가능하게 만든다. 승격 시점은 드리프트가 실제로 아파질 때(체감상 앱 3-4개).

## 4. kit / 앱 경계

### kit으로 승격

| kit 모듈 | 출처 | 비고 |
|---|---|---|
| `kit/i18n/` | `lib/i18n/*` (32줄) | `createI18n(translations)` 형태로 제네릭화 |
| `kit/currency.ts` | `lib/currency.ts` (32줄) | 지역 통화 환산 + 통화별 소수점 자릿수 규칙 |
| `kit/theme.ts` | `app/index.tsx` 57-82 (`PALETTES`) | 화면 파일에 묻혀 있어 추출 필요 |
| `kit/prefs.ts` | `lib/preferences.ts` (35줄) | 저장 키를 제네릭 파라미터로 |
| `kit/ads/AdBanner*` | `components/AdBanner*` (48줄) | `.web.tsx` 분기 포함, 거의 그대로 |
| `kit/share/` | `ShareCard`(158줄) + `lib/share-card.ts` + 캡처 플로우 | 카드 골격만 kit, 내용은 children 주입 |
| `kit/chart/` | `LineChart` 사용부 + `MAX_CHART_LABELS` | 라벨 다이어트 로직 |

### 앱에 남김

- 도메인 계산 로직 (`lib/loan.ts` 등)
- `lib/i18n/translations.ts` - 앱별 문자열 (구조만 kit 규약을 따름)
- `app/index.tsx` - 화면. kit 컴포넌트 조합만 남게

### 의도적으로 kit에 넣지 않는 것

**`lib/snapshot.ts`(42줄)와 `fetchJsonWithTimeout`(`app/index.tsx` 116-138).** 첫 검증 앱(대출 상환 계산기)은 순수 수식이라 네트워크도 시세 스냅샷도 쓰지 않는다. 한 번도 호출되지 않는 모듈을 kit에 올리면 검증되지 않은 추상화가 된다. TSLA4Tesla에 그대로 두고, 외부 데이터를 쓰는 3번째 앱이 나올 때 승격한다.

**숫자 입력 필드 컴포넌트.** 재사용될 게 거의 확실하지만 앱 1개만으로는 올바른 props 인터페이스를 정할 수 없다. 두 번째 앱에서 같은 필요가 나타나면 두 사용처를 보고 승격한다.

따라서 이번 kit의 범위는 **"입력 -> 계산 -> 차트 -> 공유 카드 -> 배너 -> 다국어"의 오프라인 계산기 골격**으로 한정한다. 나중에 `kit/data/` 계층이 추가로 붙는 구조.

### 경계 강제

`kit`이 `app/`이나 `lib/`을 import하지 못하도록 ESLint `no-restricted-imports`로 기계적으로 막는다. 사람이 지키는 규칙은 3개월 뒤에 깨진다.

### 스타터 저장소 구조

```
expo-adapp-starter/
  kit/                       <- 앱을 import하지 않음 (단방향)
    i18n/  ads/  share/  chart/  theme.ts  currency.ts  prefs.ts
  app/index.tsx              <- 플레이스홀더 화면 (kit 사용 예시 겸)
  lib/                       <- 앱 고유 로직이 들어갈 빈 자리
  .github/workflows/build.yml
  docs/RELEASE.md            <- Play 출시 절차 체크리스트
```

## 5. 빌드 파이프라인: EAS Build -> GitHub Actions

Expo 프레임워크(expo-router, expo-localization, expo-media-library, expo-sharing)는 **그대로 유지**한다. 교체 대상은 클라우드 빌드 서비스인 EAS Build뿐이다.

### 선행 리스크: 키스토어 확보

현재 업로드 키스토어는 EAS가 보관 중이다. TSLA4Tesla는 이미 Play에 게시되어 Play 앱 서명이 걸려 있으므로, 다른 키로 서명한 AAB는 거부된다.

```bash
npx eas-cli credentials    # Android > 키스토어 다운로드
```

`.jks` 파일과 함께 **alias / keystore password / key password 3개 값**도 확보해야 한다. 이 단계를 건너뛰면 TSLA4Tesla는 더 이상 업데이트를 올릴 수 없게 되고, 복구에 Google 업로드 키 재설정 요청(수일 소요)이 필요하다. **따라서 이 작업이 Phase 0이다.**

신규 앱은 처음부터 로컬에서 키스토어를 만들어 Secrets에 넣으면 되므로 이 문제가 없다. 단 앱마다 키스토어는 별도여야 한다.

### 워크플로

`.github/workflows/build.yml` (수동 trigger + 태그 push)

```
1. checkout
2. setup-node 20 + npm ci
3. setup-java 17            <- Expo SDK 54의 AGP 요구사항
4. setup-android
5. npm run typecheck        <- tsc --noEmit (신규 추가)
6. npm run test:ci
7. npx expo prebuild --platform android --clean
8. 키스토어 복원: base64 -d -> android/app/upload.jks
9. ./gradlew :app:bundleRelease
10. AAB를 artifact로 업로드
```

`expo prebuild`는 CNG(continuous native generation)라 `android/`를 매 빌드마다 생성하고 버린다. 네이티브 디렉터리를 저장소에 두고 관리할 필요가 없어 Expo SDK 업그레이드 시 네이티브 병합 충돌을 겪지 않는다. `react-native-google-mobile-ads`의 config plugin도 prebuild 단계에서 `AndroidManifest`에 앱 ID를 주입한다.

### 현재 코드의 CI 차단 요소

`package.json`의 `"test": "jest --watchAll"`은 CI에서 종료되지 않는다. `test:ci`를 `jest --ci --watchAll=false`로 분리하고 CI는 그것을 쓴다. `typecheck` 스크립트(`tsc --noEmit`)도 함께 추가한다.

참고: TypeScript는 이미 100% 적용 상태다. `app/`, `components/`, `lib/`에 `.js` 파일이 없고 `tsconfig.json`에 `"strict": true`가 켜져 있다. 다만 타입 검사를 실행하는 스크립트와 CI 게이트가 없어서 타입 오류가 빌드 시점까지 발견되지 않는다.

### Secrets 규약 (앱마다)

`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`

### 결정 사항

- **versionCode**: `app.json`의 `android.versionCode`에 명시적으로 유지 (`eas.json`이 `appVersionSource: "local"`). CI는 "마지막 출시본보다 큰가"만 검사한다. `github.run_number` 자동 증가는 로컬 빌드와 어긋나 Play가 거부할 수 있어 쓰지 않는다.
- **Play 업로드 자동화**: 1단계에서는 AAB를 artifact로 받아 수동 업로드. Google Play API 서비스 계정 설정이 선행돼야 하므로, 앱 3개쯤에서 수동 업로드가 실제로 아파질 때 `r0adkll/upload-google-play`로 자동화한다.
- **저장소 공개 여부**: TSLA4Tesla는 Public이며 그대로 둔다. 신규 앱 저장소는 앱별로 결정한다 (아래 "Actions 무료 한도" 참고).
- **EAS 존치**: `eas.json`은 남긴다. GitHub Actions 장애 시 대체 경로가 있는 것이 낫고 유지 비용은 파일 하나다.

### Actions 무료 한도

**Public 저장소는 Actions 분이 무제한이다.** TSLA4Tesla는 Public이므로(2026-08-19 확인) 이 저장소의 빌드 횟수에는 제약이 없다.

Private 저장소를 쓸 경우에만 한도가 걸리며, 그 월 2,000분은 **저장소당이 아니라 계정 전체 합산**이다. Android 릴리스 빌드가 약 20분이면 전체 합쳐 월 100회. 앱 10개면 앱당 월 10회다.

따라서 앱별 저장소의 공개 여부가 곧 빌드 예산 결정이다:

- **Public**: 빌드 무제한. 소스가 공개된다
- **Private**: 계정 합산 월 2,000분 공유. 앱 20-30개를 넘어가면 Gradle 캐시 최적화나 종량 결제가 필요하다

앱마다 선택할 수 있으므로, 공개해도 무방한 앱은 Public으로 두어 한도를 아끼는 절충이 가능하다.

## 6. 첫 검증 앱: 대출 상환 계산기

### 선정 이유

이 앱의 역할은 수익이 아니라 **kit의 모든 조각을 한 번씩 실제로 사용해 추상화가 맞는지 증명하는 것**이다. 일부만 쓰면 검증이 반쪽이 된다.

또한 Google Play의 중복 앱 / 최소 기능 정책을 고려했다. TSLA4Tesla의 시세 소스만 코인이나 금으로 바꾼 앱은 kit 검증에는 완벽하지만 "같은 앱 재포장"으로 판정될 위험이 있다. **도메인은 확실히 다르고 구조는 같은 앱**이 안전하다.

대출 계산기는 수식이 만국공통이라 6개국어 i18n 자산을 그대로 쓸 수 있다는 점도 선정 근거다 (연봉 실수령액 계산기는 세법이 나라마다 달라 이 자산을 못 쓴다).

### kit 사용 검증표

| kit 모듈 | 이 앱에서의 용도 |
|---|---|
| `kit/i18n` | 6개국어 문자열 |
| `kit/currency` | 지역 통화로 금액 표시 |
| `kit/theme` | 다크모드 |
| `kit/prefs` | 마지막 입력값 복원 |
| `kit/ads/AdBanner` | 하단 배너 |
| `kit/share/` | "원금균등으로 하면 이자 OOO 절약" 비교 카드 |
| `kit/chart/` | 잔액 감소 곡선 2개(방식별) 겹쳐 그리기 |

7개 모듈 전부 호출된다. 하나라도 안 쓰이면 그 추상화는 검증되지 않은 것이므로 이 표가 kit 범위 확정의 근거다.

### 기능 범위

**포함**

- 입력: 대출 원금, 연이율, 기간, 상환 방식
- 상환 방식 3종: 원리금균등 / 원금균등 / 만기일시
- 출력: 월 상환액, 총 이자, 총 상환액, 월별 상환 스케줄
- 방식 간 총이자 비교 (이 앱의 핵심 가치이자 공유 동기)

**제외 (YAGNI)**

거치기간, 중도상환 수수료, 변동금리, 다중 대출. 수요가 확인되면 v1.1에서 추가.

### 화면 구조

입력 섹션 / 결과 요약 / 차트 / 스케줄 테이블(접기) / 배너.

`app/index.tsx` 목표는 250줄 이하 (TSLA4Tesla의 999줄 대비).

### 계산 로직의 위험 지점

`lib/loan.ts` 설계 시 반드시 처리할 항목. 금융 계산은 조용히 틀리는 것이 최악이라 이 목록이 곧 테스트 목록이 된다.

1. **이율 0%에서 0으로 나눔.** 원리금균등 공식 `M = P x r / (1 - (1+r)^-n)`에서 `r = 0`이면 분모가 0이 되어 NaN/Infinity가 나온다. 무이자 할부는 실제 사용 사례이므로 `M = P / n`으로 분기해야 한다. 가장 흔히 빠뜨리는 버그.
2. **반올림 누적 오차.** 월 상환액을 원 단위로 반올림하면 n회 누적 오차로 마지막 회차 후 잔액이 0이 되지 않는다. 실제 금융 계산기 방식대로 마지막 회차에 잔액을 몰아주는 balloon adjustment로 처리한다.
3. **통화별 소수점 자릿수.** KRW 0자리, USD/EUR 2자리, JPY 0자리. `kit/currency`가 통화를 이미 알고 있으므로 자릿수 규칙도 여기서 제공한다.
4. **극단 입력.** 기간 600개월 + 고금리에서 `(1+r)^-n`의 부동소수점 정밀도, 원금/기간 0, 음수 입력.

### 테스트 전략

기존 `lib/__tests__/` 패턴을 따르고 TDD로 진행한다. 핵심은 하드코딩된 기대값보다 **불변식(invariant)을 주력으로 삼는 것**이다.

- 상환 스케줄의 원금 합계 == 대출 원금 (정확히)
- 스케줄의 (원금 + 이자) 합계 == 총 상환액
- 마지막 회차 후 잔액 == 0 (반올림 후에도 정확히)
- 스케줄 길이 == 기간(개월)
- 같은 조건에서 원금균등 총이자 < 원리금균등 총이자 < 만기일시 총이자
- 이율 0%일 때 총이자 == 0 이고 월 상환액 == 원금 / 기간

여기에 외부 계산기로 교차 검증한 기준값 2-3개를 회귀 테스트로 고정한다. 검증하지 않은 임의의 숫자는 기대값으로 쓰지 않는다.

**kit 테스트**: 기존 테스트도 kit으로 함께 이동한다. 단방향 의존 구조이므로 kit 테스트는 앱 없이 독립 실행되어야 하며, 이것이 경계를 제대로 그었는지 확인하는 척도다.

## 7. 신규 앱 출시 시 반복 작업

`docs/release-checklist-v1.4.0.md`의 경험을 스타터의 `docs/RELEASE.md`로 일반화한다. 앱별로 매번 필요한 것:

- AdMob에 앱 추가 + 배너 광고 단위 생성
- **Play 스토어 등록정보 > 웹사이트에 `https://hanjaejoon.github.io` 입력** - AdMob이 앱별 등록정보의 도메인을 크롤링하므로 빠뜨리면 앱 인증이 실패한다
- 앱 콘텐츠 선언 (광고 ID / 광고 포함 / 데이터 보안), IARC 등급
- 앱별 키스토어 생성 + GitHub Secrets 등록

계정 단위라 **재작업이 불필요한 것**: `app-ads.txt` (게시자 계정에 묶임), Play 개인 개발자 계정의 비공개 테스트 요건(계정 단위 1회성 관문으로 추정, Phase 1에서 실제 확인 필요).

## 8. 작업 순서

**Phase 0. 키스토어 확보**

`eas credentials`로 `.jks` + 비밀번호 3종 확보. 읽기 전용이라 안전하지만 이것 없이는 이후 전부 막힌다.

**Phase 1. TSLA4Tesla로 빌드 파이프라인 검증**

`typecheck` / `test:ci` 스크립트 추가 -> GitHub Actions 워크플로 작성 -> **이미 출시된 앱으로 먼저 실행**. 신규 앱으로 처음 시도하면 실패 시 원인이 파이프라인인지 앱인지 구분되지 않는다. 기존 앱은 EAS 결과물이라는 비교 대상이 있다.

- 완료 기준: GH Actions가 만든 AAB가 Play **내부 테스트 트랙**에 업로드 성공 (= 서명 일치 확인). 프로덕션은 건드리지 않는다.
- 겸사겸사 확인: 신규 앱이 비공개 테스트 요건을 다시 거쳐야 하는지 여부

**Phase 2. kit 추출** (가장 큰 작업)

`app/index.tsx` 999줄에서 theme / share / chart 추출, `lib/`을 `kit/`으로 재배치, ESLint 경계 규칙 추가. 기존 테스트 전부 통과가 회귀 판정 기준.

완료 기준:

- TSLA4Tesla가 kit을 통해서만 공통 기능을 쓰고, `app/index.tsx`에는 TSLA 도메인 UI만 남는다
- `app/index.tsx` **600줄 이하** (999줄 대비). 근거: `PALETTES` 26줄 + `fetchJsonWithTimeout` 23줄 + 캡처/공유 플로우 + 차트 라벨 로직이 빠지고, `makeStyles` 293줄 중 공통 레이아웃/카드/버튼 스타일이 `kit/theme`으로 이동한다. 대출 계산기의 250줄 목표보다 큰 이유는 TSLA4Tesla가 차량 선택/기간 탭/시세 갱신 등 도메인 UI를 더 많이 갖기 때문이다
- 기존 테스트 7개 파일 전부 통과 (회귀 판정)
- kit 테스트가 앱 코드 없이 독립 실행된다

**Phase 3. `expo-adapp-starter` 저장소 생성**

검증된 kit 복사 + 플레이스홀더 화면 + 워크플로 + `docs/RELEASE.md`. 이 스펙 문서도 여기로 복사한다.

**Phase 4. 대출 계산기**

스타터 클론 -> `lib/loan.ts` TDD -> 화면 -> 6개국어 -> 출시. **소요 시간 실측.**

**Phase 5. 회고**

실측 시간을 근거로 kit 승격 후보(숫자 입력 필드 등) 정리.

### 기간 추정

Phase 0-1 반나절, **Phase 2가 1-2일**(999줄 리팩터링이 실질적 무게), Phase 3 반나절, Phase 4 1-2일. 합계 대략 1주.

## 9. 미해결 항목

- **AdMob 앱 인증** (TSLA4Tesla): 2026-08-19 기준 미통과. app-ads.txt와 Play 등록정보 도메인은 정상 확인됐고, AdMob 크롤러의 도메인 감지 지연(최대 7일)으로 판단. 2026-08-22 / 08-26 재확인 예정. 자세한 내용은 `docs/release-checklist-v1.4.0.md` 참고.
- **Play 비공개 테스트 요건의 적용 범위**: 계정 단위 1회성인지 앱 단위인지 Phase 1에서 Play Console로 실제 확인. 앱 단위라면 다량 출시 전략의 병목이 되므로 전략 재검토가 필요하다.
