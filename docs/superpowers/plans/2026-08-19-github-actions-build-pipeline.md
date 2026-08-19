# GitHub Actions 빌드 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** TSLA4Tesla의 Android 릴리스 빌드를 EAS Build에서 GitHub Actions로 옮기고, 생성된 AAB가 기존 업로드 키로 서명되었음을 Play 내부 테스트 트랙 업로드로 검증한다.

**Architecture:** `expo prebuild`(CNG)로 `android/`를 매 빌드 생성하고 Gradle `:app:bundleRelease`로 AAB를 만든다. 서명은 `android.injected.signing.*` Gradle 프로퍼티로 주입하므로 생성된 `build.gradle`을 손대지 않는다. 툴체인 검증(디버그 키 서명)과 실제 서명을 별도 작업으로 분리해, 실패 시 원인이 툴체인인지 시크릿인지 즉시 구분되게 한다.

**Tech Stack:** Expo SDK 54, React Native, TypeScript 5.9, Jest 29 (jest-expo preset), GitHub Actions (ubuntu-latest), JDK 17 (Temurin), Gradle (AGP), Node 20

**Spec:** `docs/superpowers/specs/2026-08-19-adapp-kit-design.md`

## Global Constraints

- Expo SDK: `expo@^54.0.33`. JDK **17** 필수 (SDK 54의 AGP 요구사항)
- Node **20** (Actions 러너)
- `react-native-google-mobile-ads`는 **16.3.4로 고정**. 16.4.0은 Expo SDK 54의 Kotlin 2.1과 비호환 (커밋 ab18fb1)
- TypeScript `strict: true` 유지
- Jest preset은 `jest-expo` (package.json의 `jest` 키)
- 패키지 이름: `com.hanjaejoon.TSLA4Tesla`
- AdMob Android 앱 ID: `ca-app-pub-2903995158289675~4308200614`
- `versionCode`는 `app.json`의 `android.versionCode`에서 **수동 관리**. CI에서 자동 증가시키지 않는다
- **프로덕션 트랙을 절대 건드리지 않는다.** 이 계획의 업로드 대상은 내부 테스트 트랙뿐이다
- 저장소는 **Public**이다 (2026-08-19 확인). Public 저장소는 Actions 분이 무제한이므로 빌드 횟수 제약이 없다. 대신 코드와 워크플로가 공개되므로 시크릿은 반드시 GitHub Secrets로만 다룬다
- 작업 브랜치: `dev/jjhan-adapp-kit`. main 병합은 squash merge
- 커밋 메시지는 conventional commit. 사용자 대상 텍스트에 `·` `—` `…` 등 비ASCII 문장부호를 쓰지 않는다
- `eas.json`은 삭제하지 않는다 (대체 경로로 존치)

---

### Task 1: 업로드 키스토어 확보 (사용자 수동 작업)

**이 작업은 에이전트가 수행할 수 없다.** 사용자가 직접 실행해야 하며, 완료 전까지 Task 4 이후로 진행할 수 없다.

**Files:** 없음 (저장소 변경 없음)

**Interfaces:**
- Consumes: 없음
- Produces: 로컬 `.jks` 파일 1개와 문자열 3개 - keystore password, key alias, key password. Task 4가 이 값들을 GitHub Secrets로 등록한다

**배경:** TSLA4Tesla는 이미 Play에 게시되어 Play 앱 서명이 적용돼 있다. 업로드 키가 바뀐 AAB는 Play가 거부한다. 현재 이 키는 EAS가 보관 중이므로 먼저 내려받아야 한다. 이 단계를 건너뛰고 새 키로 서명하면 앱 업데이트가 영구 차단되고, 복구에 Google 업로드 키 재설정 요청(수일 소요)이 필요하다.

- [x] **Step 1: EAS 자격증명 화면 진입**

터미널에서 실행 (대화형이므로 사용자가 직접):

```bash
npx eas-cli credentials
```

플랫폼 선택에서 `Android`, 프로필은 `production`을 고른다.

- [x] **Step 2: 키스토어 내려받기**

메뉴에서 `Keystore: Manage everything needed to build your project` -> `Download existing keystore`를 선택한다.

CLI가 다음 4가지를 출력하거나 파일로 저장한다. **전부 기록해야 한다:**

- `.jks` 파일 (기본 저장 경로를 확인할 것)
- Keystore password
- Key alias
- Key password

- [x] **Step 3: expo.dev에서 키스토어 지문 확인**

**로컬 `keytool` 사용을 전제하지 않는다.** 이 개발 환경에는 JDK가 설치돼 있지 않고(2026-08-19 확인), 빌드가 전부 Actions에서 도므로 앞으로도 설치할 이유가 없다. 대신 expo.dev가 해당 키스토어의 지문을 화면에 표시해주므로 그것을 쓴다.

expo.dev > 프로젝트 > Credentials > Android > production > Keystore 카드의 **SHA-256 fingerprint** 값을 기록한다.

실물 AAB에 대한 검증은 Task 4 Step 8에서 CI가 수행한다 (Actions 러너에는 JDK 17이 있다). 그쪽이 "키가 맞는가"보다 강한 "이 AAB가 올바른 키로 서명됐는가"를 확인하므로, 로컬 확인은 생략해도 검증 공백이 생기지 않는다.

- [x] **Step 4: Play Console의 업로드 인증서와 대조**

Play Console > TSLA4Tesla > 좌측 메뉴 **Google Play로 보호됨** > **앱 서명**으로 이동한다.

주의: 이 페이지에는 블록이 두 개 있다. 위쪽 **"앱 서명 키"**(Google이 보관하는 배포용 키, 지문이 버튼 뒤에 숨어 있음)가 아니라, 아래쪽 **"업로드 키 인증서"** 블록의 **SHA-256 인증서 지문**과 대조해야 한다.

직접 링크:
`https://play.google.com/console/u/0/developers/8656894949276987026/app/4972640630515465678/keymanagement`

**확인된 기준값 (2026-08-19):**

```
A2:AA:AB:6A:63:E5:06:BF:E4:47:99:B3:28:F0:30:87:CC:1B:28:DF:BF:9D:B4:30:83:10:91:41:11:01:4B:2D
```

expo.dev 값과 Play Console 값이 **일치함을 확인했다.** Task 4 Step 8에서 CI가 출력하는 AAB 서명 지문도 이 값과 같아야 한다.

- 일치: 올바른 키를 확보한 것이다. Task 2로 진행
- 불일치: 다른 프로필의 키를 받았을 가능성이 크다. Step 1로 돌아가 프로필을 다시 확인한다. **불일치 상태로 계속 진행하면 안 된다**

- [x] **Step 5: 키스토어 파일을 저장소 밖에 보관**

`.gitignore`에 `*.jks`가 이미 있어 커밋되지는 않지만, 저장소 디렉터리 안에 두지 않는 편이 안전하다. 저장소 바깥의 안전한 위치로 옮긴다.

커밋할 변경사항 없음.

---

### Task 2: CI용 npm 스크립트 추가

**Files:**
- Modify: `package.json` (scripts 블록)

**Interfaces:**
- Consumes: 없음
- Produces: `npm run typecheck`, `npm run test:ci` 두 명령. Task 3의 워크플로가 이 이름 그대로 호출한다

**배경:** 현재 `"test": "jest --watchAll"`은 감시 모드라 CI에서 종료되지 않고 워크플로 타임아웃까지 매달린다. 또 타입 검사를 실행하는 스크립트가 없어 `strict: true`가 켜져 있음에도 타입 오류가 빌드 시점까지 발견되지 않는다.

- [x] **Step 1: 현재 스크립트가 CI에서 못 쓰는 상태임을 확인**

```bash
npm test -- --listTests
```

`--watchAll`이 붙어 있어 프로세스가 스스로 끝나지 않는 것을 확인한다. 확인했으면 `Ctrl+C`로 중단한다.

- [x] **Step 2: 스크립트 2개 추가**

`package.json`의 `scripts` 블록에 다음 두 줄을 추가한다. 기존 `"test": "jest --watchAll"`은 로컬 개발용이므로 **그대로 둔다.**

```json
"typecheck": "tsc --noEmit",
"test:ci": "jest --ci --watchAll=false"
```

적용 후 `scripts` 블록 전체는 다음과 같아야 한다:

```json
"scripts": {
  "start": "expo start",
  "reset-project": "node ./scripts/reset-project.js",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest --watchAll",
  "test:ci": "jest --ci --watchAll=false",
  "typecheck": "tsc --noEmit",
  "lint": "expo lint"
}
```

- [x] **Step 3: test:ci가 스스로 종료되는지 확인**

```bash
npm run test:ci
```

Expected: 기존 테스트 7개 파일이 모두 통과하고 **명령이 프롬프트로 돌아온다.** 돌아오지 않으면 `--watchAll=false`가 빠진 것이다.

- [x] **Step 4: typecheck 통과 확인**

```bash
npm run typecheck
```

Expected: 출력 없이 종료 코드 0.

오류가 나면 실제 타입 문제이므로 여기서 고친다. 특히 `.expo/types/`가 생성돼 있지 않으면 expo-router 관련 타입 오류가 날 수 있다. 그 경우 `npx expo start` 를 한 번 실행해 타입을 생성한 뒤 다시 시도한다. **이 관찰 결과를 기록해 둔다 - Task 3에서 CI 단계 순서를 정하는 근거가 된다.**

**관찰 결과 (2026-08-19):** `.expo/`와 `expo-env.d.ts`를 제거한 CI 동일 조건에서도 `tsc --noEmit`이 종료 코드 0으로 통과했다. 따라서 Task 3에서 `Typecheck` 단계를 `Expo prebuild` 뒤로 옮길 필요가 없다.

- [x] **Step 5: 커밋**

```bash
git add package.json
git commit -m "chore: CI용 typecheck/test:ci 스크립트 추가"
```

---

### Task 3: 워크플로 작성 및 툴체인 검증 (서명 없이)

**Files:**
- Create: `.github/workflows/build.yml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 2의 `npm run typecheck`, `npm run test:ci`
- Produces: `workflow_dispatch`로 실행되는 `Android Build` 워크플로. `app-release-aab` 이름의 artifact를 남긴다. Task 4가 이 파일에 서명 단계를 추가한다

**배경:** 시크릿 없이 먼저 돌려서 툴체인(Node/JDK/Android SDK/prebuild/Gradle)만 검증한다. Expo가 생성하는 `build.gradle`의 release 서명 설정은 기본적으로 디버그 키를 쓰므로 이 단계에서도 AAB는 만들어진다. 이렇게 분리하면 다음 작업에서 실패했을 때 원인이 툴체인이 아니라 시크릿/서명임이 확정된다.

- [x] **Step 1: prebuild 산출물을 gitignore에 추가**

`expo prebuild`는 `android/`와 `ios/`를 생성한다. 현재 `.gitignore`에 두 경로가 없어 실수로 커밋될 수 있다. 파일 끝에 다음을 추가한다:

```
# expo prebuild (CNG) 산출물 - 매 빌드 재생성되므로 커밋하지 않는다
/android
/ios
```

- [x] **Step 2: 워크플로 파일 작성**

`.github/workflows/build.yml`을 새로 만든다:

```yaml
name: Android Build

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm run test:ci

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17

      - uses: android-actions/setup-android@v3

      - uses: gradle/actions/setup-gradle@v4

      - name: Expo prebuild
        run: npx expo prebuild --platform android --clean

      - name: Build AAB
        working-directory: android
        run: ./gradlew :app:bundleRelease --no-daemon

      - name: Show signing certificate
        run: keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab

      - uses: actions/upload-artifact@v4
        with:
          name: app-release-aab
          path: android/app/build/outputs/bundle/release/app-release.aab
          if-no-files-found: error
```

- [ ] **Step 3: 커밋 및 푸시**

워크플로는 기본 브랜치가 아닌 곳에서도 `workflow_dispatch`로 실행할 수 있지만, 브랜치를 선택하려면 원격에 올라가 있어야 한다.

```bash
git add .github/workflows/build.yml .gitignore
git commit -m "ci: GitHub Actions Android 빌드 워크플로 추가"
git push -u origin dev/jjhan-adapp-kit
```

- [ ] **Step 4: 워크플로 실행**

GitHub 저장소 > Actions > `Android Build` > `Run workflow` -> 브랜치 `dev/jjhan-adapp-kit` 선택 후 실행한다.

- [ ] **Step 5: 결과 확인**

Expected: 모든 단계 성공, `app-release-aab` artifact 생성.

실패 시 단계별 대응:

- **Typecheck 실패**: Task 2 Step 4에서 `.expo/types` 문제를 겪었다면 CI에서도 같은 문제다. `Typecheck` 단계를 `Expo prebuild` 단계 **뒤로** 옮긴다 (prebuild가 타입을 생성한다). 그 경우 `Typecheck`/`Test` 두 단계를 `Expo prebuild` 아래로 이동시킨다
- **`gradlew: Permission denied`**: `Build AAB` 단계 앞에 `- run: chmod +x android/gradlew` 를 추가한다
- **Gradle OOM / 힙 부족**: `Build AAB` 단계에 `env: GRADLE_OPTS: -Xmx4g` 를 추가한다
- **google-mobile-ads 관련 Kotlin 오류**: `react-native-google-mobile-ads` 버전이 16.3.4인지 확인한다 (Global Constraints)

- [ ] **Step 6: 서명 주체 확인 (이 단계에서는 불일치가 정상)**

`Show signing certificate` 단계의 로그를 본다. `SHA256:` 지문이 출력되며, 이 값은 Task 1 Step 3의 업로드 키 지문과 **다를 것이다** (디버그 키로 서명됐기 때문). 여기서는 "AAB가 만들어지고 서명 정보를 읽을 수 있다"는 사실만 확인하면 된다.

- [ ] **Step 7: 수정이 있었다면 커밋**

Step 5에서 워크플로를 고쳤다면:

```bash
git add .github/workflows/build.yml
git commit -m "ci: Android 빌드 워크플로 수정"
git push
```

---

### Task 4: 업로드 키 서명 적용

**Files:**
- Modify: `.github/workflows/build.yml`

**Interfaces:**
- Consumes: Task 1의 `.jks` 파일과 비밀번호 3종, Task 3의 워크플로
- Produces: 업로드 키로 서명된 AAB. Task 5가 이것을 Play에 올린다

**배경:** `expo prebuild`가 `android/`를 매번 새로 만들기 때문에 생성된 `build.gradle`을 수정하는 방식은 쓸 수 없다. 대신 AGP가 제공하는 `android.injected.signing.*` Gradle 프로퍼티로 서명 정보를 주입한다. 이 방식은 생성 파일을 건드리지 않는다.

- [ ] **Step 1: 키스토어를 base64로 변환**

바이너리 파일은 GitHub Secrets에 직접 넣을 수 없으므로 base64로 인코딩한다. `<경로>`는 Task 1의 실제 경로로 바꾼다:

```bash
base64 -w 0 <경로>/keystore.jks > keystore.b64
```

macOS라면 `-w 0` 대신 `base64 -i <경로>/keystore.jks -o keystore.b64` 를 쓴다.

**주의:** 줄바꿈이 섞이면 복원 시 깨진다. 위 명령의 `-w 0`이 줄바꿈을 막는다.

- [ ] **Step 2: GitHub Secrets 등록 (사용자 수동 작업)**

저장소 > Settings > Secrets and variables > Actions > New repository secret 에서 4개를 등록한다. 이름은 **정확히 아래와 같아야 한다** (워크플로가 이 이름을 참조한다):

| Secret 이름 | 값 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `keystore.b64` 파일의 내용 전체 |
| `ANDROID_KEYSTORE_PASSWORD` | Task 1의 keystore password |
| `ANDROID_KEY_ALIAS` | Task 1의 key alias |
| `ANDROID_KEY_PASSWORD` | Task 1의 key password |

- [ ] **Step 3: 임시 파일 삭제**

```bash
rm keystore.b64
```

- [ ] **Step 4: 워크플로에 키스토어 복원 단계 추가**

`.github/workflows/build.yml`의 `Expo prebuild` 단계와 `Build AAB` 단계 **사이에** 다음을 삽입한다:

```yaml
      - name: Restore keystore
        run: echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$RUNNER_TEMP/upload.jks"
        env:
          ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
```

- [ ] **Step 5: Build AAB 단계를 서명 주입 방식으로 교체**

기존 `Build AAB` 단계를 다음으로 **통째로 대체**한다:

```yaml
      - name: Build AAB
        working-directory: android
        env:
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          ./gradlew :app:bundleRelease --no-daemon \
            -Pandroid.injected.signing.store.file="$RUNNER_TEMP/upload.jks" \
            -Pandroid.injected.signing.store.password="$ANDROID_KEYSTORE_PASSWORD" \
            -Pandroid.injected.signing.key.alias="$ANDROID_KEY_ALIAS" \
            -Pandroid.injected.signing.key.password="$ANDROID_KEY_PASSWORD"
```

**주의:** 비밀번호를 `-P` 인자에 직접 쓰지 않고 환경변수를 거치는 이유는, Gradle이 실패했을 때 로그에 전체 명령줄을 출력하면서 비밀번호가 노출되는 것을 막기 위해서다.

- [ ] **Step 6: 커밋 및 푸시**

```bash
git add .github/workflows/build.yml
git commit -m "ci: 업로드 키스토어 서명 적용"
git push
```

- [ ] **Step 7: 워크플로 재실행**

Actions > `Android Build` > `Run workflow` (브랜치 `dev/jjhan-adapp-kit`).

- [ ] **Step 8: 서명 일치 검증 (이 작업의 합격 기준)**

`Show signing certificate` 단계 로그의 `SHA256:` 지문을 확인한다.

Expected: **Task 1 Step 3에서 기록한 업로드 키 지문과 정확히 일치.**

- 일치: Task 5로 진행
- 불일치: 서명 주입이 적용되지 않은 것이다. `Restore keystore` 단계가 `Build AAB` 앞에 있는지, Secrets 이름 4개의 철자가 맞는지 확인한다. **불일치 상태로 Play에 업로드하지 않는다** (거부되며, 반복 시도는 의미가 없다)

---

### Task 5: Play 내부 테스트 트랙 업로드로 최종 검증 (사용자 수동 작업)

**Files:**
- Modify: `app.json` (`expo.android.versionCode`)

**Interfaces:**
- Consumes: Task 4가 만든 서명된 AAB
- Produces: 이 계획의 최종 산출물 - GitHub Actions 빌드가 Play에 실제로 수용된다는 증거

**배경:** 서명 지문 대조(Task 4 Step 8)는 강력한 사전 검증이지만, Play가 실제로 받아들이는지는 업로드해봐야 확정된다. **프로덕션이 아니라 내부 테스트 트랙에만 올린다.** 내부 테스트는 프로덕션 롤아웃에 영향을 주지 않는다.

- [ ] **Step 1: versionCode 증가**

현재 프로덕션은 versionCode 6이다. Play는 같은 versionCode를 두 번 받지 않으므로 7로 올린다.

`app.json`의 `expo.android.versionCode`를 `6`에서 `7`로 수정한다:

```json
"android": {
  "versionCode": 7,
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#E82127"
  },
  "package": "com.hanjaejoon.TSLA4Tesla"
}
```

`expo.version`(1.4.0)은 **바꾸지 않는다.** 이 빌드는 기능 변경이 없는 파이프라인 검증용이다.

- [ ] **Step 2: 커밋 및 푸시**

```bash
git add app.json
git commit -m "chore: 파이프라인 검증용 versionCode 7"
git push
```

- [ ] **Step 3: 워크플로 재실행 후 artifact 내려받기**

Actions > `Android Build` > `Run workflow` (브랜치 `dev/jjhan-adapp-kit`).

완료 후 실행 결과 페이지 하단의 `app-release-aab` artifact를 내려받아 압축을 푼다.

- [ ] **Step 4: Play Console 내부 테스트에 업로드**

Play Console > TSLA4Tesla > 테스트 및 출시 > **테스트 > 내부 테스트** > 새 버전 만들기.

`app-release.aab`를 업로드한다.

Expected: 업로드 성공. 출시 노트는 "빌드 파이프라인 검증" 정도로 간단히 적는다.

**실패 시 판정:**

- "업로드한 APK 또는 Android App Bundle이 잘못된 인증서로 서명되었습니다" -> 서명이 틀린 것이다. Task 4로 돌아간다. **이 오류는 프로덕션에 영향을 주지 않는다**
- "이미 사용된 버전 코드입니다" -> Step 1의 versionCode를 8로 올려 다시 시도한다

- [ ] **Step 5: 검증 완료 확인**

업로드가 수락되면 이 계획의 목표가 달성된 것이다. GitHub Actions가 EAS Build를 대체할 수 있음이 증명됐다.

**내부 테스트 버전을 프로덕션으로 승격하지 않는다.** 검증이 목적이며, 프로덕션은 versionCode 6인 채로 둔다.

- [ ] **Step 6: 결과를 스펙의 미해결 항목에 반영**

`docs/superpowers/specs/2026-08-19-adapp-kit-design.md`의 9절 "미해결 항목"에서 Play 비공개 테스트 요건 항목을 실제 확인 결과로 갱신한다.

Play Console에서 내부 테스트 업로드가 추가 테스터 요건 없이 진행됐다면, 계정 단위 관문을 이미 통과한 것이다. 해당 항목을 다음과 같이 고친다:

```markdown
- **Play 비공개 테스트 요건**: 2026-08-19 확인 결과 계정 단위 1회성 관문이며 이미 통과.
  신규 앱은 프로덕션 직행 가능. (Phase 1에서 내부 테스트 업로드로 확인)
```

다르게 나왔다면 관찰한 사실을 그대로 적는다. 추측을 사실처럼 적지 않는다.

- [ ] **Step 7: 커밋**

```bash
git add docs/superpowers/specs/2026-08-19-adapp-kit-design.md
git commit -m "docs: Play 비공개 테스트 요건 확인 결과 반영"
git push
```

---

### Task 6: versionCode 중복 방지 가드

**Files:**
- Modify: `.github/workflows/build.yml`

**Interfaces:**
- Consumes: Task 3/4의 워크플로, Task 5에서 업로드된 versionCode 7
- Produces: `vc<N>` 형식의 git 태그로 관리되는 출시 이력. 이후 모든 빌드가 이 가드를 통과해야 한다

**배경:** 스펙 5절은 "CI는 versionCode가 마지막 출시본보다 큰가만 검사한다"고 정했다. 이 검사가 없으면 versionCode를 올리는 것을 잊고 빌드를 돌려 20분을 낭비한 뒤 Play 업로드 단계에서야 거부당한다. Play API 연동은 아직 없으므로(스펙 5절에서 뒤로 미룸) 출시 이력을 git 태그로 기록해 기준값으로 삼는다.

**스펙과 달라지는 점:** 스펙 5절은 워크플로 트리거를 "수동 trigger + 태그 push"로 적었으나, 태그 push 트리거는 이 가드와 충돌한다. `vc7` 태그를 푸시해 빌드를 띄우면 그 빌드는 "versionCode 7이 이미 vc7로 출시됐다"며 스스로 실패한다. 따라서 트리거는 `workflow_dispatch`만 유지하고, 태그는 출시 이력 기록 용도로만 쓴다. 이 결정을 스펙에도 반영한다 (Step 5).

- [ ] **Step 1: 기존 출시 이력을 태그로 기록**

Task 5에서 versionCode 7을 내부 테스트에 올렸다. 이것을 기준값으로 남긴다.

```bash
git tag vc7
git push origin vc7
```

프로덕션의 versionCode 6은 이 파이프라인으로 만든 것이 아니므로 태그하지 않는다. 가드는 "가장 높은 태그보다 큰가"를 보므로 vc7만 있으면 충분하다.

- [ ] **Step 2: checkout이 태그를 가져오도록 수정**

`.github/workflows/build.yml`의 첫 단계를 다음으로 교체한다. 기본 checkout은 얕은 복제라 태그가 없다:

```yaml
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
```

- [ ] **Step 3: 가드 단계 추가**

`Install dependencies` 단계 **바로 뒤에** 다음을 삽입한다. 빌드 20분을 쓰기 전에 실패해야 의미가 있으므로 앞쪽에 둔다:

```yaml
      - name: Guard versionCode
        run: |
          CURRENT=$(node -p "require('./app.json').expo.android.versionCode")
          HIGHEST=$(git tag -l 'vc*' | sed 's/^vc//' | sort -n | tail -1)
          HIGHEST=${HIGHEST:-0}
          echo "app.json versionCode=$CURRENT / 출시된 최고 태그=vc$HIGHEST"
          if [ "$CURRENT" -le "$HIGHEST" ]; then
            echo "::error::versionCode $CURRENT 는 이미 출시된 vc$HIGHEST 이하입니다. app.json의 versionCode를 올리세요."
            exit 1
          fi
          echo "versionCode 검사 통과"
```

- [ ] **Step 4: 가드가 실제로 막는지 확인**

가드는 "통과하는 것"보다 "막아야 할 때 막는 것"을 확인해야 의미가 있다.

`app.json`의 `versionCode`를 일시적으로 `7`로 둔 채(Task 5 이후 현재 값) 커밋/푸시하고 워크플로를 실행한다.

```bash
git add .github/workflows/build.yml
git commit -m "ci: versionCode 중복 방지 가드 추가"
git push
```

Actions > `Android Build` > `Run workflow` (브랜치 `dev/jjhan-adapp-kit`).

Expected: **`Guard versionCode` 단계에서 실패.** 로그에 `versionCode 7 는 이미 출시된 vc7 이하입니다`가 보인다. 빌드 단계까지 가지 않고 1분 내에 끝난다.

실패하지 않고 통과했다면 Step 1의 태그가 원격에 올라가지 않았거나 Step 2의 `fetch-depth: 0`이 빠진 것이다.

- [ ] **Step 5: versionCode를 올려 통과 확인 및 스펙 반영**

`app.json`의 `expo.android.versionCode`를 `8`로 올린다.

동시에 `docs/superpowers/specs/2026-08-19-adapp-kit-design.md`의 116번째 줄 근처를 수정해 트리거 결정을 실제 구현과 맞춘다:

```markdown
`.github/workflows/build.yml` (수동 trigger `workflow_dispatch`만 사용)
```

그리고 같은 문서 5절 "결정 사항"의 versionCode 항목 끝에 다음 문장을 덧붙인다:

```markdown
검사 기준은 `vc<N>` 형식의 git 태그로 기록한 출시 이력이다. 태그 push 트리거는 이 가드와 충돌하므로(태그를 밀면 그 빌드가 스스로 실패) 쓰지 않는다.
```

- [ ] **Step 6: 통과 확인**

```bash
git add app.json docs/superpowers/specs/2026-08-19-adapp-kit-design.md
git commit -m "ci: versionCode 8로 상향 및 트리거 결정 스펙 반영"
git push
```

Actions에서 워크플로를 다시 실행한다.

Expected: `Guard versionCode` 단계가 `versionCode 검사 통과`를 출력하고 빌드가 끝까지 진행된다.

---

## 완료 기준

이 계획은 다음이 모두 참일 때 완료된다:

1. `npm run typecheck`와 `npm run test:ci`가 로컬과 CI 양쪽에서 통과하고, `test:ci`는 스스로 종료된다
2. GitHub Actions `Android Build` 워크플로가 성공하고 AAB artifact를 남긴다
3. 그 AAB의 서명 SHA-256이 Play Console의 업로드 키 인증서와 일치한다
4. 해당 AAB가 Play 내부 테스트 트랙에 수락된다
5. `Guard versionCode` 단계가 중복 versionCode를 실제로 차단하는 것이 확인됐다 (Task 6 Step 4)
6. 프로덕션 트랙은 versionCode 6으로 변경되지 않은 상태다

## 다음 계획

Phase 2(kit 추출)와 Phase 3(`expo-adapp-starter` 저장소)는 별도 계획으로 작성한다. Phase 4(대출 계산기)는 kit의 API가 확정된 뒤에 작성한다 - 존재하지 않는 함수 시그니처를 추측해 계획에 넣지 않기 위해서다.
