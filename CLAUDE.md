# TSLA4Tesla

보유한 TSLA 주식으로 테슬라 차를 몇 대 살 수 있는지 계산해 보여주는 단일 화면 앱.
Expo SDK 57 / expo-router / TypeScript strict, AdMob 배너 수익형. Play 프로덕션 출시됨
(`com.hanjaejoon.TSLA4Tesla`).

배경 기록은 `docs/` 에 있다. **환경/의존성 판단을 하기 전에
`docs/sdk-upgrade-54-to-57.md` 를 열 것** (락파일, Kotlin, TS 6 함정의 근거가 전부 여기
있다). 출시 절차는 `docs/release-checklist-v1.4.0.md`, 스토어 등록정보는
`docs/store-listing/` 이다. 이 파일에는 코드를 쓰다가 어기기 쉬운 제약만 적는다.

## 구조

- `app/` - expo-router 화면. `app/index.tsx` 가 사실상 앱 전체(약 950줄)다.
  차량 모델/트림 가격표(`TESLA_VEHICLES`), 광고 단위 ID, Yahoo Finance 조회가 여기 있다
- `lib/` - 앱 도메인 로직. `calculator.ts`(순수 계산), `snapshot.ts`(번들 fallback 데이터
  해석), `i18n/`, `preferences.ts`, `share-card.ts`
- `kit/` - 앱 도메인과 무관한 재사용 모듈 (`microapp-starter` 와 공유). 규칙은
  `kit/README.md`
- `components/ShareCard.tsx` - 공유 카드 본문
- `assets/data/market-snapshot.json` - 오프라인 fallback 데이터.
  손으로 고치지 말고 `node scripts/update-market-snapshot.js` 로 갱신한다
  (릴리스 빌드 전에 실행)

## 코드 경계

- **`kit/` 은 `app/`, `lib/`, `components/` 를 import 하지 않는다.** 단방향이며 ESLint
  `no-restricted-imports` 로 강제하고 CI 의 lint 단계에서 걸린다. 앱 고유 값(브랜드 색,
  광고 단위 ID, 번역 문자열)은 kit 안에 상수로 두지 말고 인자나 prop 으로 넘긴다
- kit 은 다른 마이크로앱과 공유하는 코드다. kit 을 고칠 일이 생기면 그 변경이 다른 앱에도
  맞는 변경인지 먼저 판단한다. **사용처가 1개뿐인 추상화는 kit 에 올리지 않는다**
- `lib/` 은 i18n 에 의존하지 않는다. 오류는 코드(`StockCountError` 같은 유니온)로 돌려주고
  문구 결정은 UI 레이어에서 한다
- 순수 함수(계산, 라벨 처리, 스냅샷 해석)는 테스트를 먼저 쓴다

## 문구는 하드코딩하지 않는다

- 화면에 보이는 문자열은 전부 `lib/i18n/translations.ts` 에 넣고 `t()` 로 쓴다.
  지원 로케일은 `en`, `ko`, `ja`, `de`, `es`, `zh` 6개이며 `en` 이 기준 키 집합이다
- **키를 추가하면 6개 로케일 전부에 추가해야 한다.** 누락은
  `lib/__tests__/i18n.test.ts` 가 키 완전성 검사로 잡는다
- 개수에 따라 단수/복수가 갈리는 문구는 문자열이 아니라 `{ one, other }` 형태로 쓰고
  `t(key, { count })` 로 호출한다

## 환경 함정

- **Expo 는 바뀌었다.** 코드를 쓰기 전에 https://docs.expo.dev/versions/v57.0.0/ 의 해당
  버전 문서를 확인할 것. 기억에 있는 예전 API 를 그대로 쓰지 말 것
- `tsconfig.json` 의 `"types": ["jest", "node"]` 를 지우면 안 된다. TypeScript 6 은
  `@types` 를 자동 포함하지 않아 테스트 전역이 전부 미해결이 된다
- `react-native-google-mobile-ads` 는 `16.3.4` 고정이다. 16.4.0 이상이 쓰는 GMA SDK
  25.4.0 은 Kotlin 2.3 컴파일이라 RN 0.86(Kotlin 2.1.20)에서 빌드가 깨진다.
  **재검토 조건은 SDK 버전이 아니라 Expo 의 Kotlin 이 2.3 이상으로 올라가는 것이다**
- `eslint-config-expo` 57 은 `react-hooks/set-state-in-effect` 를 켠다. 이펙트 본문에서
  동기 setState 를 하는 함수를 바로 호출하지 말고, 파생 상태는 이펙트로 동기화하지 말 것
- `/android`, `/ios` 는 `expo prebuild` 산출물이라 gitignore 대상이다. 커밋하지 말 것.
  `.expo/` 도 마찬가지이며 lint ignores 에 들어 있다
- Expo Go 에서는 광고 배너가 나오지 않는다 (네이티브 모듈 없음). 광고는 Actions 빌드에서만
  확인된다
- `android.package` 는 Play 에 한 번 올리면 영구히 바꿀 수 없다

## 패키지 매니저

- **pnpm 을 쓴다** (`packageManager: pnpm@11.9.0`, npm 에서 전환 완료).
  `npm install` / `npm ci` 를 쓰지 말 것. 락파일은 `pnpm-lock.yaml` 이다
- pnpm 11 의 핵심 설정은 `.npmrc` 나 `package.json` 의 `pnpm` 필드가 아니라
  **`pnpm-workspace.yaml`** 에 둔다. 여기에 `nodeLinker: hoisted`(네이티브 모듈 호환),
  `allowBuilds`, 보안 `overrides` 가 있다. `package.json` 의 `pnpm.overrides` 는
  pnpm 11 이 **조용히 무시하므로** 쓰지 말 것
- 설치 후 `node_modules/.pnpm` 에 패키지 디렉터리가 생기면 isolated 로 설치된 것이다.
  hoisted 가 적용되면 `.pnpm` 에는 내부 상태 파일(lock.yaml)만 있다
- npm 시절의 `@emnapi/*` 락파일 규율은 pnpm 에서는 불필요하다. pnpm-lock.yaml 은
  플랫폼 무관하게 optional 의존(`@emnapi/core`, `@emnapi/runtime`)을 기록하므로
  Windows 에서 개별 설치해도 Linux CI 가 깨지지 않는다 (전환 목적이 이것이다)
- 의존성은 가능하면 `pnpm expo install` 로 다룬다
- SDK 메이저 업그레이드에서는 락파일을 재생성한다. 기존 락파일 위에
  `expo install --fix` 를 돌리면 `expo-modules-core` 등이 중첩 설치돼 테스트와
  `expo prebuild` 가 함께 깨진다

## versionCode

- `app.json` 의 `expo.android.versionCode` 다. **임의로 올리지 말 것.** 출시할 때
  사용자가 판단한다
- 출시 이력은 `vc<N>` 형식의 git 태그로 기록하고, CI 의 `Guard versionCode` 단계가
  `app.json` 값이 최고 `vc*` 태그보다 큰지 검사한다
- 안드로이드 빌드 워크플로(`.github/workflows/build.yml`)는 `workflow_dispatch` 전용이라
  push 만으로는 빌드/업로드가 일어나지 않는다

## 검증

| 명령 | 하는 일 |
|---|---|
| `pnpm run typecheck` | `tsc --noEmit` (strict) |
| `pnpm run test:ci` | Jest 1회 |
| `pnpm run lint` | ESLint (kit 단방향 의존 규칙 포함) |
| `pnpm jest kit` | kit 테스트만 (경계 확인) |

**완료 기준은 `pnpm run typecheck && pnpm run test:ci && pnpm run lint` 통과다.**
완료를 주장하기 전에 실제로 돌리고 출력을 확인한다. CI 도 이 셋을 네이티브 빌드보다
앞에 두고 있다(빌드 1회가 25분).

## 커밋과 push

- 커밋 메시지는 **한글 conventional commit** (`fix: ...`, `chore: ...`, `docs: ...`).
  작업 단위로 쪼갠다. 서드파티 업그레이드는 원인을 좁힐 수 있게 따로 올린다
- **`git push` 는 사용자가 명시적으로 지시할 때만 한다.** force push 는 금지
- 커밋 메시지와 문서에서 엠대시, 화살표, 말줄임표, 가운뎃점 같은 특수문자를 쓰지 않고
  ASCII 표기(`-`, `->`, `...`)를 쓴다
