# v1.4.0 (versionCode 6) 출시 체크리스트

작성: 2026-08-18. vc5(1.2.0) 검토 승인 대기 중 상태에서 중단된 출시 작업의 재개용 문서.

## 이번 버전에 포함된 것

- AdMob 하단 배너 광고 (react-native-google-mobile-ads 16.3.4 고정 - 16.4.0은 Expo SDK 54의 Kotlin 2.1과 비호환)
- 6개 언어 다국어 지원 (ko/en/ja/de/es/zh, 기기 언어 자동 감지) + 지역 통화 환산
- 계산 결과 브랜드 카드 공유/갤러리 저장 (차량 실루엣 3종)
- 의존성 취약점 수정 (image-size 2건은 패치 미출시로 보류 - 빌드 툴체인 전용)

## 완료된 상태

- [o] main push 완료 (103f708)
- [o] EAS 프로덕션 빌드 성공: build a5b3a1d0-4758-4d29-ad2c-e46e2bcf61c8
- [o] AAB 다운로드: 프로젝트 루트 `TSLA4Tesla-1.4.0-vc6.aab` (62MB)
- [o] Play Console 게시 개요에 저장됨 (아직 검토 미전송):
  - 프로덕션 배포 국가 전체 확대
  - 스토어 등록정보 7개 언어 (기본 en-US 영어 교체, ko/ja/de/es-ES/es-419/zh-CN 추가)

## vc5 승인 확인 방법

https://play.google.com/store/apps/details?id=com.hanjaejoon.TSLA4Tesla 가
404 -> 200 (페이지 생성)으로 바뀌면 승인/게시된 것. (첫 프로덕션 출시)

## vc5 승인 후 남은 절차 (순서대로)

1. Play Console > 정책 > 앱 콘텐츠에서 광고 선언 변경:
   - 광고 ID 선언: "사용함"
   - 광고: "광고 포함"
   - 데이터 보안: 광고 SDK 수집 항목 반영 (AdMob: 기기 ID/광고 ID 등)
2. 프로덕션 > 새 버전 만들기 > `TSLA4Tesla-1.4.0-vc6.aab` 업로드 (수동 - 위젯 자동화 제한)
3. 출시 노트 작성 (다국어 지원 + 광고 도입 + 공유 기능)
4. 게시 개요에서 저장된 변경사항(국가/등록정보) + vc6 릴리스 일괄 검토 전송
5. AdMob 콘솔에서 앱-스토어 연결 (Play 게시 후 검색 가능해지면)

## AAB 재다운로드가 필요하면

```bash
npx eas-cli build:view a5b3a1d0-4174-... --json   # applicationArchiveUrl 확인
# 또는
npx eas-cli build:list --platform android --limit 5
```

빌드 ID: a5b3a1d0-4758-4d29-ad2c-e46e2bcf61c8 (commit ab18fb1, 1.4.0/vc6)
