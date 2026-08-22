# Expo SDK 54 -> 57 업그레이드 기록

작성: 2026-08-20
실행: 2026-08-20
상태: 코드 작업 + 네이티브 빌드 검증 완료 (실기기 확인 대기)

## 왜 했는가

`microapp-starter` 템플릿 저장소를 만들려고 `create-expo-app`을 실행했더니 **SDK 57**이 생성됐다. TSLA4Tesla는 SDK 54였다.

새 앱을 계속 찍어낼 계획인데 스타터를 54로 맞추면 앞으로 만드는 앱이 전부 3버전 뒤처진 채 시작한다. 반대로 스타터만 57로 올리면 kit이 두 SDK에서 검증되지 않은 채 갈라진다.

따라서 **TSLA4Tesla를 먼저 57로 올려 업그레이드를 실증한 뒤, 그 결과를 스타터에 반영한다.** TSLA4Tesla에는 테스트 59개와 GitHub Actions 빌드가 있어 회귀를 잡을 수 있다.

## 실제로 올라간 버전

| | 이전 | 이후 |
|---|---|---|
| expo | `^54.0.33` | `~57.0.14` |
| react-native | `0.81.5` | `0.86.2` |
| react | `19.1.0` | `19.2.3` |
| expo-router | `~6.0.23` | `~57.0.14` |
| typescript | `~5.9.2` | `~6.0.3` |
| jest-expo | `~54.0.17` | `~57.0.4` |
| react-native-view-shot | `4.0.3` | `5.1.0` |
| react-native-chart-kit | `^6.12.0` | `^7.0.2` |
| react-native-google-mobile-ads | `16.3.4` (고정) | **`16.3.4` 유지** (아래) |

`expo` 는 `~57.0.14` 로 고정했다. `expo install --fix` 가 남긴 `^57` 은 범위가 너무 넓다.

## 걸린 문제 6가지와 처리

### 1. TypeScript 6 은 `node_modules/@types` 를 자동 포함하지 않는다

`expo install --fix` 가 typescript 를 5.9 -> 6.0.3 으로 올린다. 그 직후 `npm run typecheck` 가 테스트 파일에서 `describe` / `it` / `expect` 미해결 오류 **178건**을 뱉었다. `@types/jest` 는 정상 설치돼 있었다.

`tsconfig.json` 에 명시적으로 넣어 해결했다.

```json
"types": ["jest", "node"]
```

스타터에도 이 설정이 들어가야 한다. TS 6 프로젝트에서 반복될 문제다.

### 2. 기존 락파일을 유지한 채 업그레이드하면 의존성이 중첩 설치된다

`expo install --fix` 를 기존 `package-lock.json` 위에 돌리면 `expo-modules-core` 와 `@expo/config-plugins` 가 `node_modules/expo/` 아래로 중첩 설치된다. 최상위로 호이스팅되지 않는다. 그 결과:

- `jest-expo` 프리셋이 `Cannot find module 'expo-modules-core'` 로 **9개 스위트 전부 실패**
- `react-native-google-mobile-ads` 의 config plugin 이 `Cannot find module '@expo/config-plugins'` 로 실패해 `expo config` / `expo prebuild` 가 죽는다

`node_modules` 와 `package-lock.json` 을 지우고 `npm install` 로 재생성하면 정상 호이스팅되고 둘 다 해결된다. **SDK 메이저 업그레이드에서는 락파일을 재생성할 것.**

### 3. `eslint-config-expo` 57 이 `react-hooks/set-state-in-effect` 를 켠다

React Compiler 규칙이다. `app/index.tsx` 에서 2건 걸렸고 둘 다 실제 안티패턴이라 구조를 고쳤다.

- **마운트 시 주가/환율 자동 조회**: `fetchStockPrice` 가 첫 줄에서 로딩 플래그를 동기 setState 한다. 이펙트 본문에서 바로 호출하면 커밋 중에 실행돼 연쇄 렌더가 된다. `Promise.resolve().then(...)` 으로 미루고 cleanup 에서 취소한다
- **트림 보정**: 차량이 바뀌어 현재 트림이 목록에 없으면 첫 트림으로 되돌리던 이펙트를 제거하고, 차량 Picker 의 `onValueChange` 에서 처리한다. 이펙트로 파생 상태를 동기화하지 않는다

### 4. google-mobile-ads 고정은 풀 수 없었다 (근거 갱신)

**결론: `16.3.4` 고정을 유지한다. 근거는 바뀌었다.**

원래 기록(커밋 `ab18fb1`)은 고정 이유를 *"16.4.0 이 쓰는 GMA SDK 25.4.0 이 Kotlin 2.3 컴파일이라 Expo SDK 54(Kotlin 2.1)와 비호환"* 이라고 적었고, 그래서 SDK 57 에서는 제약이 사라질 것으로 봤다. **사라지지 않았다.**

| | Kotlin |
|---|---|
| React Native 0.81 (Expo SDK 54) | 2.1.x |
| React Native 0.86 (Expo SDK 57) | **2.1.20** |

`node_modules/react-native/gradle/libs.versions.toml` 의 `kotlin = "2.1.20"`. RN 0.86 도 여전히 Kotlin 2.1 대다. GMA SDK 25.4.0 은 그대로 Kotlin 2.3 이므로 `compileReleaseKotlin` 실패 조건이 동일하다.

버전별 GMA SDK 매핑을 확인했다.

| react-native-google-mobile-ads | GMA SDK (android) |
|---|---|
| 16.3.2 | 25.0.0 |
| 16.3.3 | 25.0.0 |
| **16.3.4** | **25.0.0** |
| 16.4.0 | 25.4.0 |
| 16.5.0 | 25.4.0 |

**16.3.4 가 GMA 25.0.0 을 쓰는 마지막 버전이다.** 중간 지점이 없다. 25.1-25.3 을 쓰는 라이브러리 버전은 존재하지 않는다.

`expo-build-properties` 로 `android.kotlinVersion` 을 2.3 으로 올리는 우회가 이론상 가능하지만, RN 0.86 이 검증한 Kotlin 을 벗어나면 다른 네이티브 모듈 전체가 위험해진다. 네이티브 빌드 1회가 25분이라 시행착오 비용도 크다. **광고 라이브러리 하나를 올리려고 툴체인 전체를 흔들 이유가 없다.**

**재검토 조건: Expo 가 Kotlin 2.3 이상으로 올라가면 그때 고정을 푼다.** SDK 버전이 아니라 Kotlin 버전이 판단 기준이다.

### 5. 개별 `npm install <pkg>` 이 락파일에서 optional 전이 의존을 떨어뜨린다

CI 의 `npm ci` 가 2초 만에 EUSAGE 로 두 번 실패했다.

    Invalid: lock file's @emnapi/wasi-threads@1.2.1 does not satisfy @emnapi/wasi-threads@1.2.3
    Missing: @emnapi/core@1.10.0 from lock file

로컬(Windows) `npm ci` 는 통과하고 CI(Linux) 만 실패했다. 커밋별로 락파일을 대조해 경로를 특정했다.

| 커밋 | `@emnapi/core` | `@emnapi/runtime` | `wasm32-wasi` 하위 중첩 |
|---|---|---|---|
| SDK 54 (origin/main) | 최상위 | 최상위 | 0 |
| `77c4ae6` (락파일 클린 재생성) | 최상위 | 최상위 | 0 |
| `a7d1953` (`npm install chart-kit`) | **누락** | **누락** | 0 |
| `5c6a567` (`npm install` 로 재동기화) | 누락 | 누락 | **3** |

원인은 `eslint-config-expo` 57 이 끌어오는 `unrs-resolver` 다. 플랫폼별 optional 바이너리 바인딩이 24개 있고 그중 `@unrs/resolver-binding-wasm32-wasi` 가 `@emnapi/*` 를 요구한다. Windows 에서 `npm install <패키지>` 를 개별 실행하면 npm 이 이 플랫폼에 필요 없다고 판단해 `@emnapi/core` / `@emnapi/runtime` 을 락파일에서 지운다. Linux 는 같은 트리를 최상위로 호이스팅해 계산하므로 락파일에 없는 항목을 요구하고, `npm ci` 가 거부한다.

**`npm install` 로 재동기화하는 것으로는 고쳐지지 않는다.** 오히려 중첩이 늘었다. `node_modules` 와 `package-lock.json` 을 **둘 다 지우고** 처음부터 설치해야 SDK 54 와 같은 호이스팅 레이아웃으로 돌아온다.

**따라서 락파일을 건드린 뒤에는 이 두 가지를 확인할 것:**

1. `node_modules` 를 지우고 `npm ci` 가 실제로 통과하는지 (로컬 통과가 Linux 통과를 보장하지는 않는다)
2. 락파일에 `node_modules/@emnapi/core` 와 `node_modules/@emnapi/runtime` 이 **최상위로** 있는지. 중첩되어 있거나 없으면 클린 재생성이 필요하다

빠르게 실패하므로(2초) CI 가 사실상의 감시자다. 다만 원인이 락파일 레이아웃이라는 것을 모르면 진단이 오래 걸린다.

### 6. expo-media-library 57 은 함수형 API를 legacy 엔트리로 옮겼다 (이미지 저장 회귀)

업그레이드 후 이미지 저장이 항상 실패했다. expo-media-library 57 이 함수형 API를 통째로 `expo-media-library/legacy` 로 옮기고, 메인 엔트리의 `saveToLibraryAsync` / `createAssetAsync` 등은 **호출 즉시 throw 하는 deprecated 스텁**으로 바꿨기 때문이다. import 와 타입 시그니처는 그대로라 typecheck / lint 로는 잡히지 않고 런타임에서만 드러난다.

legacy 엔트리로 우회하는 대신 새 클래스 API로 마이그레이션했다 (`kit/share/capture.ts`).

```ts
// 이전 (57 메인 엔트리에서 즉시 throw)
await MediaLibrary.saveToLibraryAsync(uri);
// 이후
await Asset.create(uri);
```

함께 알아야 할 변경 두 가지:

- **권한 semantics 가 바뀌었다.** 새 `requestPermissionsAsync(writeOnly)` 는 Android 13+ 에서 쓰기 권한이 시스템상 불필요해 **프롬프트 없이 granted 를 반환한다**. 권한 거부('denied') 분기는 Android 12 이하와 iOS 에서만 실제로 탄다
- **`file://` 스킴이 필수다.** Android 네이티브 구현이 `filePath.toFile()` 을 쓰므로 `Asset.create()` 인자는 file:// 스킴 URI여야 한다. `captureCard` 가 이미 file:// 로 정규화해 반환하므로 호출부 변경은 없다

## 검증

로컬에서 실제로 돌린 결과다.

| 검사 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run test:ci` | 59개 통과 (9 스위트) |
| `npm run lint` | 통과 (kit 단방향 의존 규칙 포함) |
| `expo config --json --full` | 통과 (config plugin 로드 확인) |
| `npm ci` (node_modules 삭제 후) | 통과 |
| GitHub Actions Android Build | **통과** (run 32277541752, AAB 74.9MB) |

CI 워크플로의 `node-version` 은 20 -> 22 로 올렸다. RN 0.86 의 `engines` 가 `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25` 라서 `"20"` 도 최신 20.x 로 해석되면 통과하지만 하한에 걸려 있어 여유가 없다.

## GitHub Actions 네이티브 빌드 결과

**성공.** run `32277541752` (sha `7f438e4`), AAB 산출물 74.9MB.

`expo prebuild` 와 `:app:bundleRelease` 가 모두 통과했으므로 **google-mobile-ads 16.3.4 고정 판단이 맞았다.** Kotlin 2.1.20 툴체인에서 GMA 25.0.0 이 정상 컴파일된다.

앞선 두 번의 실패는 둘 다 `npm ci` 단계였고 원인은 위 5번(락파일 레이아웃)이다. 네이티브 계층 문제는 없었다.

## 남은 확인 (테스트로 잡히지 않는 것)

1. **GitHub Actions 네이티브 빌드** - `expo prebuild` + `bundleRelease` 가 되는지. Kotlin 관련 실패가 여기서 드러난다
2. **실기기 확인** (Play 내부 테스트 트랙)
   - **차트 렌더링** - chart-kit 7 은 새 관리자의 재작성판이다. 타입은 맞았지만 렌더 결과가 다를 수 있다
   - **공유 카드 캡처** - view-shot 4 -> 5 메이저 상승
   - **광고 배너 표시**

프로덕션 트랙은 건드리지 않는다. 문제가 생기면 브랜치를 버리면 원상복구된다.

## 커밋 구성

원인을 좁힐 수 있도록 서드파티는 나눠서 올렸다.

1. `chore: Expo SDK 54 -> 57 업그레이드 (관리 패키지 일괄 정렬)` - 관리 패키지 + 위 1/2/3번 수정
2. `chore: react-native-chart-kit 6.12.0 -> 7.0.2`
3. `docs: google-mobile-ads 고정 근거 갱신 + CI Node 22` - 위 4번 판단 기록

`react-native-view-shot` 은 SDK 57 부터 Expo 관리 대상이라 1번 커밋에서 `--fix` 가 함께 올렸다.
