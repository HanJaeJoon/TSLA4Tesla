import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';

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

// fileName을 주면 캡처 임시 파일(ReactNative-snapshot-image....png)을
// 캐시 디렉터리에 그 이름으로 옮겨, 공유/저장 시 사용자에게 보이는 파일명을 정한다.
export async function captureCard(
  ref: React.RefObject<View | null>,
  fileName?: string
): Promise<string> {
  const uri = await captureRef(ref, { format: 'png', quality: 1 });
  const captured = uri.startsWith('file') ? uri : `file://${uri}`;
  if (!fileName) return captured;
  const dest = new File(Paths.cache, fileName);
  await new File(captured).move(dest, { overwrite: true });
  return dest.uri;
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
