import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type BrandCardProps = {
  brandColor: string;
  appName: string;
  footerText: string;
  width?: number;
  children: React.ReactNode;
};

// 공유 이미지 캡처 전용 카드 골격. 화면 밖에 렌더링해 두고 captureCard로 캡처한다.
// 다크모드와 무관하게 항상 브랜드 색 고정.
// borderRadius를 주지 않는다 - 캡처 PNG의 모서리가 투명해져 뷰어에 따라 흰 가장자리로 보인다.
export const BrandCard = forwardRef<View, BrandCardProps>(function BrandCard(props, ref) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: props.brandColor, width: props.width ?? 360 }]}
    >
      <Text style={styles.appName}>{props.appName}</Text>
      {props.children}
      <Text style={styles.footer}>{props.footerText}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  footer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});
