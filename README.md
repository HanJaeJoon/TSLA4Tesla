# TSLA4Tesla

보유한 TSLA 주식으로 테슬라 차를 몇 대 살 수 있는지 계산해 보여주는 단일 화면 모바일 앱이다.
보유 주식 수를 입력하고 차량 모델/트림(Model 3 / Model Y / Model S / Model X / Cybertruck)을
고르면, Yahoo Finance 에서 조회한 현재 주가로 구매 가능 대수와 다음 한 대까지의 부족분을
계산해 보여준다. 네트워크 실패 시에는 번들된 오프라인 스냅샷 데이터(`assets/data/market-snapshot.json`)로
대체(fallback)한다.

주가 추이 차트(1M / 6M / 1Y / 5Y), 결과 공유 카드(이미지 캡처 -> 공유/갤러리 저장),
기기 지역 통화 환산 표시, 6개 로케일(en, ko, ja, de, es, zh) i18n, AdMob 배너 광고를
포함한다. Expo SDK 57 / expo-router / TypeScript strict 기반이며 Google Play 에
프로덕션 출시되어 있다 (`com.hanjaejoon.TSLA4Tesla`).

## 개발

```bash
npm install        # 의존성 설치
npx expo start     # 개발 서버 실행 (Expo Go 에서는 광고 배너가 나오지 않음)
```

검증 명령 (완료 기준은 세 개 모두 통과):

```bash
npm run typecheck  # tsc --noEmit (strict)
npm run test:ci    # Jest 1회 실행
npm run lint       # ESLint (kit 단방향 의존 규칙 포함)
```

## 디렉터리 구조

- `app/` - expo-router 화면. `app/index.tsx` 가 사실상 앱 전체다.
  차량 모델/트림 가격표, 광고 단위 ID, Yahoo Finance 조회가 여기 있다
- `lib/` - 앱 도메인 로직. `calculator.ts`(순수 계산), `snapshot.ts`(번들 fallback 데이터
  해석), `i18n/`(번역), `preferences.ts`(입력값 저장), `share-card.ts`
- `kit/` - 앱 도메인과 무관한 재사용 모듈 (다른 마이크로앱과 공유). 광고, 차트, 통화,
  테마, 공유 캡처 등. `kit/` 은 `app/`, `lib/`, `components/` 를 import 하지 않는다
  (ESLint 로 강제). 규칙은 `kit/README.md` 참조
- `components/ShareCard.tsx` - 공유 카드 본문
- `assets/data/market-snapshot.json` - 오프라인 fallback 데이터.
  손으로 고치지 말고 `node scripts/update-market-snapshot.js` 로 갱신한다
- `docs/` - SDK 업그레이드 기록, 출시 체크리스트, 스토어 등록정보

## 빌드 / 배포

안드로이드 AAB 빌드는 GitHub Actions 워크플로를 `workflow_dispatch` 로 수동 실행해서
만든다. push 만으로는 빌드/업로드가 일어나지 않는다. 출시 절차와 `versionCode` 규칙은
`docs/release-checklist-v1.4.0.md` 와 `CLAUDE.md` 를 참조한다.
