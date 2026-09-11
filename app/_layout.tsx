import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ensureAdsConsent } from '../kit/ads/consent';

export default function RootLayout() {
  // UMP 동의는 앱 시작 시 1회만 확인한다 (배너 요청보다 앞서야 한다)
  useEffect(() => {
    void ensureAdsConsent();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
