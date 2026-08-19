import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

// 공유 시트를 지원하는 환경인지 (웹 일부/시뮬레이터에서 미지원)
export function useShareAvailability(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    Sharing.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);
  return available;
}

export async function captureCard(ref: React.RefObject<View | null>): Promise<string> {
  const uri = await captureRef(ref, { format: 'png', quality: 1 });
  return uri.startsWith('file') ? uri : `file://${uri}`;
}

export async function shareImage(uri: string): Promise<void> {
  await Sharing.shareAsync(uri, { mimeType: 'image/png' });
}

// 권한이 거부되면 'denied'를 반환한다. 사용자 안내 문구는 앱이 번역해 표시한다.
export async function saveImageToLibrary(uri: string): Promise<'saved' | 'denied'> {
  const { granted } = await MediaLibrary.requestPermissionsAsync(true);
  if (!granted) return 'denied';
  await MediaLibrary.saveToLibraryAsync(uri);
  return 'saved';
}
