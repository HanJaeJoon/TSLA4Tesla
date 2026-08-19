# Expo SDK 54 -> 57 업그레이드 계획

작성: 2026-08-20
상태: 착수 전 (2026-08-21 진행 예정)

## 왜 하는가

`microapp-starter` 템플릿 저장소를 만들려고 `create-expo-app`을 실행했더니 **SDK 57**이 생성됐다. TSLA4Tesla는 SDK 54다.

새 앱을 계속 찍어낼 계획인데 스타터를 54로 맞추면 앞으로 만드는 앱이 전부 3버전 뒤처진 채 시작한다. 반대로 스타터만 57로 올리면 kit이 두 SDK에서 검증되지 않은 채 갈라진다.

따라서 **TSLA4Tesla를 먼저 57로 올려 업그레이드를 실증한 뒤, 그 결과를 스타터에 반영한다.** TSLA4Tesla에는 테스트 59개와 GitHub Actions 빌드가 있어 회귀를 잡을 수 있다. 스타터에는 아직 아무것도 없다.

## 버전 간극

| | 현재 (TSLA4Tesla) | 목표 (SDK 57 템플릿) |
|---|---|---|
| expo | `^54.0.33` | `~57.0.14` |
| react-native | `0.81.5` | `0.86.2` |
| react | `19.1.0` | `19.2.3` |
| expo-router | `~6.0.23` | `~57.0.14` |

메이저 3단계이며 React Native가 0.81 -> 0.86으로 올라간다. 네이티브 계층 변화가 크다.

## 위험 지점

Expo가 관리하지 않는 서드파티가 실제 위험이다. `npx expo install --check`가 잡아주지 않는다.

| 패키지 | 현재 | 최신 | 비고 |
|---|---|---|---|
| `react-native-google-mobile-ads` | **16.3.4 (고정)** | 16.5.0 | 아래 참고 |
| `react-native-chart-kit` | `^6.12.0` | **7.0.2** | 메이저 상승. 최신 배포 2026-07-09로 유지보수 중 |
| `react-native-view-shot` | `4.0.3` | **5.1.1** | 메이저 상승 |
| `react-native-svg` | `^15.15.4` | - | Expo 관리 대상, `expo install`이 맞춰줌 |
| `@react-native-picker/picker` | `2.11.1` | - | Expo 관리 대상 |
| `@react-native-async-storage/async-storage` | `2.2.0` | - | Expo 관리 대상 |

### google-mobile-ads 고정을 반드시 재검토할 것

16.3.4로 고정한 이유는 **"16.4.0이 Expo SDK 54의 Kotlin 2.1과 비호환"** 이었다 (커밋 ab18fb1). 이 제약은 SDK 54에 묶인 것이므로 **SDK 57에서는 근거가 사라진다.** 오히려 16.3.4를 그대로 두면 새 SDK와 맞지 않아 빌드가 깨질 수 있다.

업그레이드 시 고정을 풀고 SDK 57에 맞는 버전을 다시 정한 뒤, `package.json`과 이 문서에 그 이유를 새로 기록한다.

## 절차

1. 작업 브랜치 `dev/jjhan-sdk57`을 만든다
2. `npx expo install expo@^57 --fix` 로 Expo 관리 패키지를 일괄 정렬한다
3. 서드파티 3종(google-mobile-ads, chart-kit, view-shot)의 버전을 개별 판단해 올린다. **한 번에 하나씩, 커밋을 나눠서** 올린다 - 깨졌을 때 원인을 좁히기 위해서다
4. `npm run typecheck && npm run test:ci && npm run lint` 통과 확인
5. GitHub Actions 빌드를 작업 브랜치에서 실행해 네이티브 빌드가 되는지 확인
6. `versionCode`를 올리고 Play 내부 테스트에 업로드해 실기기에서 확인한다. **차트 렌더링과 공유 카드 캡처를 눈으로 볼 것** - 이 둘은 테스트로 잡히지 않는다
7. main에 squash merge

## 회귀 안전망

- 테스트 59개 (kit 24개는 앱 없이 독립 실행)
- `npm run typecheck` (strict)
- `npm run lint` (kit 단방향 의존 규칙 포함)
- GitHub Actions 빌드 - 네이티브 컴파일까지 확인
- 서명 자동 검증 - AAB가 올바른 업로드 키로 서명됐는지 빌드가 직접 대조

테스트로 **잡히지 않는 것**: 차트 실제 렌더링, 공유 카드 캡처 이미지, 광고 배너 표시. 6단계의 실기기 확인이 필요한 이유다.

## 롤백

프로덕션은 versionCode 6이며 이 작업으로 건드리지 않는다. 내부 테스트 트랙에만 올리므로 문제가 생겨도 사용자에게 영향이 없다. 브랜치를 버리면 원상복구된다.

## 이 작업이 끝나면

`microapp-starter` 저장소 생성(Phase 3)을 재개한다. 그때는 SDK 57에서 검증된 kit을 복사하게 되므로 마이그레이션 없이 진행된다.

참고: `C:\Users\jj272\Desktop\Source\microapp-starter`에 SDK 57 프로젝트가 생성돼 있다. 손대지 않은 상태이며, Phase 3 재개 시 다시 만들어도 무방하다.
