import React, { useEffect } from 'react';
import { View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Go에는 AdMob 네이티브 모듈이 포함되어 있지 않아 광고를 띄울 수 없다 (EAS 빌드에서만 동작)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// AdMob 콘솔에서 실제 배너 광고 단위 ID(ca-app-pub-XXXX/YYYY)를 발급받으면 여기에 입력.
// 비어 있으면 구글 공식 테스트 광고가 표시된다 (실수로 실광고를 테스트하는 사고 방지).
const PRODUCTION_BANNER_AD_UNIT_ID = 'ca-app-pub-2903995158289675/6341864832';

export default function AdBanner() {
  if (isExpoGo) {
    return null;
  }
  return <NativeAdBanner />;
}

let adsInitialized = false;

function NativeAdBanner() {
  // Expo Go에서는 이 모듈을 로드하는 순간 크래시가 나므로 여기서 지연 require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ads = require('react-native-google-mobile-ads');
  const { BannerAd, BannerAdSize, TestIds, default: mobileAds } = ads;

  useEffect(() => {
    if (!adsInitialized) {
      adsInitialized = true;
      mobileAds().initialize();
    }
  }, [mobileAds]);

  const adUnitId =
    __DEV__ || !PRODUCTION_BANNER_AD_UNIT_ID
      ? TestIds.ADAPTIVE_BANNER
      : PRODUCTION_BANNER_AD_UNIT_ID;

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
