# v1.4.0 (versionCode 6) 출시 기록

작성: 2026-08-18 (출시 재개용 체크리스트)
갱신: 2026-08-20 (AdMob 앱 인증 통과 - 이 문서의 마지막 미완 항목이 닫혔다)

## 결과: 출시 완료

v1.4.0 (vc6)이 프로덕션에 게시되었습니다.

- 스토어 페이지: https://play.google.com/store/apps/details?id=com.hanjaejoon.TSLA4Tesla
- 프로덕션 트랙: 활성 / 최신 출시 버전 6 (1.4.0) / 국가/지역 177개 / 롤아웃 100%
- 콘텐츠 등급: 3세 이상 (IARC 등급 발급 완료, 2026-08-19)
- 정책 상태: 발견된 정책 문제 없음
- 게시 개요: 게시되지 않은 변경사항 없음

## 이번 버전에 포함된 것

- AdMob 하단 배너 광고 (react-native-google-mobile-ads 16.3.4 고정 - 16.4.0은 Expo SDK 54의 Kotlin 2.1과 비호환)
- 6개 언어 다국어 지원 (ko/en/ja/de/es/zh, 기기 언어 자동 감지) + 지역 통화 환산
- 계산 결과 브랜드 카드 공유/갤러리 저장 (차량 실루엣 3종)
- 의존성 취약점 수정 (image-size 2건은 패치 미출시로 보류 - 빌드 툴체인 전용)

## 완료된 항목

- [o] main push (103f708)
- [o] EAS 프로덕션 빌드: a5b3a1d0-4758-4d29-ad2c-e46e2bcf61c8 (commit ab18fb1, 1.4.0/vc6)
- [o] vc6 AAB 업로드
- [o] 출시 노트 작성
- [o] 프로덕션 배포 국가 전체 확대 (177개국)
- [o] 스토어 등록정보 7개 언어 (기본 en-US 영어 교체, ko/ja/de/es-ES/es-419/zh-CN 추가)
- [o] 검토 전송 및 승인/게시
- [o] 앱 콘텐츠 선언 (2026-08-19 갱신, 조치된 선언 11개)
  - 광고 ID: "앱에서 광고 ID를 사용한다고 지정"
  - 광고: "앱에 광고가 있다고 답변" -> Play에 '광고 포함' 라벨 표시
  - 데이터 보안: 광고 SDK 수집 항목 반영
- [o] AdMob 앱-스토어 연결
  - AdMob 앱 ID: ca-app-pub-2903995158289675~4308200614 (Android)
  - 스토어: Google Play / 패키지 이름: com.hanjaejoon.TSLA4Tesla
- [o] app-ads.txt 게시 (아래 참고)
- [o] Play 스토어 설정 > 웹사이트: https://hanjaejoon.github.io

## AdMob 앱 인증 (2026-08-20 통과)

- [o] **AdMob 앱 인증 통과.** `광고 게재가 제한됨` 이 해제되어 배너가 실제로 게재된다

인증이 요구한 것은 두 개뿐이었고 둘 다 이미 갖춰져 있었다.

1. `app-ads.txt` 가 **도메인 루트**에 서빙되고 있을 것 (https://hanjaejoon.github.io/app-ads.txt)
2. **Play 스토어 설정의 웹사이트 필드**가 그 도메인일 것 (AdMob 이 앱별 등록정보의
   도메인을 크롤링한다)

즉 인증은 코드나 빌드와 무관하고, 순전히 "Play 등록정보에 적힌 도메인" 과
"그 도메인 루트의 app-ads.txt" 를 맞추는 일이다. 크롤링 주기 때문에 조건을
갖춰도 바로 통과하지 않고 기다려야 한다.

### 다음 앱에 그대로 넘어가는 것

`app-ads.txt` 의 한 줄은 앱이 아니라 **게시자 계정**(`pub-2903995158289675`)에
묶인다. 같은 AdMob 계정으로 내는 앱은 파일을 고칠 필요가 없다.
**앱마다 해야 하는 일은 Play 스토어 설정의 웹사이트 필드 하나뿐이다.**

`loan-calculator` 는 그 필드를 이미 넣어 뒀다
(`../loan-calculator/docs/RELEASE.md` 6단계). 게시되면 같은 경로로 인증된다.

## 남은 항목

없다. v1.4.0 출시와 광고 게재까지 전부 닫혔다.

## app-ads.txt 설정

AdMob 앱 인증용. 저장소: https://github.com/HanJaeJoon/HanJaeJoon.github.io (Public, GitHub Pages 사용자 사이트)

```
google.com, pub-2903995158289675, DIRECT, f08c47fec0942fa0
```

- 서빙 URL: https://hanjaejoon.github.io/app-ads.txt
- 같은 저장소에 index.html 랜딩 페이지도 함께 게시 (웹사이트 링크가 404가 되지 않도록)

### 앱을 추가로 출시할 때

app-ads.txt의 한 줄은 앱이 아니라 게시자 계정(pub-2903995158289675)에 묶입니다. 같은 AdMob 계정으로 내는 앱은 몇 개든 이 파일 하나로 커버되므로 **파일을 수정할 필요가 없습니다.**

대신 신규 앱마다 다음을 해야 합니다:

- Play Console > 스토어 설정 > 스토어 등록정보 연락처 세부정보 > 웹사이트에 `https://hanjaejoon.github.io` 입력
  (AdMob은 앱별로 해당 앱의 스토어 등록정보에 적힌 도메인을 크롤링함)

미디에이션 파트너를 추가하면 파트너별로 한 줄씩 app-ads.txt에 추가합니다. 이것도 앱 단위가 아니라 계정 단위입니다.

### 주의: 반드시 사용자 사이트여야 함

app-ads.txt는 도메인 루트에 있어야 합니다. 프로젝트 사이트(`hanjaejoon.github.io/<repo>/app-ads.txt`)로는 인증되지 않습니다.

## 참고

### 개인정보처리방침

`https://jjester.tistory.com/175` (티스토리) 유지. 웹사이트 필드와는 별개 항목이며, app-ads.txt 인증과 무관하므로 옮길 필요 없습니다.

### AAB 재다운로드

로컬 `TSLA4Tesla-1.4.0-vc6.aab` 파일은 업로드 후 삭제되어 현재 없습니다. 필요하면:

```bash
npx eas-cli build:view a5b3a1d0-4758-4d29-ad2c-e46e2bcf61c8 --json   # applicationArchiveUrl 확인
# 또는
npx eas-cli build:list --platform android --limit 5
```
