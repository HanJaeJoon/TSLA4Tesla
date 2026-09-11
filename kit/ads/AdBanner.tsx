import React, { useEffect } from 'react';
import { View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Go에는 AdMob 네이티브 모듈이 포함되어 있지 않아 광고를 띄울 수 없다 (EAS/Actions 빌드에서만 동작)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// enabled: UMP 동의 판정이 끝나 광고를 요청해도 되는 상태인지.
// 기본값 true 는 동의 흐름을 아직 붙이지 않은 앱의 기존 동작을 그대로 둔다.
// EEA/UK 에 배포하는 앱은 kit/ads/consent 의 shouldRequestAds() 결과를 넘긴다.
export default function AdBanner({
  productionUnitId,
  enabled = true,
}: {
  productionUnitId?: string;
  enabled?: boolean;
}) {
  if (isExpoGo || !enabled) {
    return null;
  }
  return <NativeAdBanner productionUnitId={productionUnitId} />;
}

let adsInitialized = false;

function NativeAdBanner({ productionUnitId }: { productionUnitId?: string }) {
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

  // 개발 빌드이거나 단위 ID가 없으면 구글 공식 테스트 광고 (실광고 오클릭 사고 방지)
  const adUnitId = __DEV__ || !productionUnitId ? TestIds.ADAPTIVE_BANNER : productionUnitId;

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
