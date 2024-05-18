# ReactNativeMyStock

### Todo
- [x] C: sms를 통한 insert
- [ ] C: sms를 통한 insert 백그라운드에서 동작 가능할지 리서치 => 일단 최초 앱 실행 이후에 백그라운드 동작
- [ ] C: sms parsing 로직 개선
- [ ] C: sms 증권사 확장
- [ ] C: 카카오톡 확장 가능할지 리서치
- [ ] R: 거래 기록 리스트 UI 리서치(현재 SectionList)
- [ ] U: row 옆 아이콘/슬라이드
- [ ] D: row 옆 아이콘/슬라이드
- [x] System: Local DB/API? ~~Realm~~ => 일단 Sqlite로 CRUD 구현
- [ ] Home: 실시간 주가
- [ ] Home: 실시간 주가변동 적용?
- [ ] Home: 평단 or 변동 그래프, 
- [ ] Home: 보유 잔고 평단, 수익률
- [ ] Home: 목표 설정, 목표 달성률
- [x] Entry: 입력 -> insert
- [x] Entry: validation
- [x] Entry: UI 개선
- [ ] List: 최소 기능
- [ ] List: UI 개선
- [ ] 용어 통일 필요
- [ ] google login?

### ~~Realm~~
- ~~https://docs.mongodb.com/realm/sdk/react-native/~~

### Button UI
- https://callstack.github.io/react-native-paper/index.html

### List UI
- https://reactnative.dev/docs/flatlist
- https://reactnative.dev/docs/sectionlist

### SMS listener
- https://github.com/andreyvital/react-native-android-sms-listener
- 일단 백그라운드에서도 sms 읽어오기 위해
`node_modules\react-native-android-sms-listener\android\src\main\java\com\centaurwarchief\smslistener\SmsListenerModule.java` 파일 아래와 같이 수정
```
@Override
public void onHostPause() {
    //unregisterReceiver(mReceiver);
}

@Override
public void onHostDestroy() {
    //unregisterReceiver(mReceiver);
}
```

### Navigation bar
- https://reactnavigation.org/

### Icons
- https://icons.expo.fyi/

### RN Examples
- https://github.com/robinhuy/react-native-expo-examples

### build & release
- https://docs.expo.dev/build/setup/
