import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { silhouetteFor } from '../lib/share-card';

const BRAND_RED = '#E82127';
const CARD_WIDTH = 360;

// 자체 제작 차량 실루엣 (Tesla 공식 에셋/사진 미사용 - 저작권/상표 이슈 회피)
// windows는 카드 배경색으로 그려 바디에서 창문을 뚫는 효과를 낸다.
const SILHOUETTES = {
  sedan: {
    body: 'M8 50 C8 45 12 41 20 39 L28 37 L74 33 C86 19 104 14 122 14 C142 14 156 20 166 32 L188 36 C202 38 210 43 210 50 C210 54 206 56 200 56 L18 56 C12 56 8 54 8 50 Z',
    windows: [
      'M78 32 C88 21 102 19 118 19 L118 32 Z',
      'M124 19 C138 19 150 24 158 32 L124 32 Z',
    ],
    wheels: [52, 170],
    wheelY: 52,
    wheelR: 13,
  },
  suv: {
    body: 'M8 50 C8 45 12 41 20 39 L26 37 L46 34 C56 17 78 11 104 11 C130 11 152 17 168 29 L186 35 C196 38 201 42 201 47 C201 52 197 55 191 55 L18 56 C12 56 8 54 8 50 Z',
    windows: [
      'M52 30 C62 18 78 15 96 15 L96 30 Z',
      'M102 15 C126 15 146 20 160 30 L102 30 Z',
    ],
    wheels: [52, 162],
    wheelY: 51,
    wheelR: 14,
  },
  pickup: {
    body: 'M14 52 L16 40 L98 16 L196 36 L198 52 C198 55 195 56 192 56 L20 56 C16 56 14 55 14 52 Z',
    windows: ['M56 33 L94 21 L100 21 L124 26 L124 33 Z', 'M130 28 L162 34 L130 34 Z'],
    wheels: [54, 164],
    wheelY: 52,
    wheelR: 13,
  },
} as const;

function VehicleSilhouette({ vehicle }: { vehicle: string }) {
  const { body, windows, wheels, wheelY, wheelR } = SILHOUETTES[silhouetteFor(vehicle)];
  return (
    <Svg width={220} height={70} viewBox="0 0 220 70">
      <Path d={body} fill="rgba(255,255,255,0.92)" />
      {windows.map((d) => (
        <Path key={d} d={d} fill={BRAND_RED} />
      ))}
      {wheels.map((cx) => (
        <React.Fragment key={cx}>
          <Circle cx={cx} cy={wheelY} r={wheelR} fill={BRAND_RED} />
          <Circle cx={cx} cy={wheelY} r={wheelR - 5} fill="#ffffff" />
          <Circle cx={cx} cy={wheelY} r={wheelR - 9.5} fill={BRAND_RED} />
        </React.Fragment>
      ))}
    </Svg>
  );
}

export type ShareCardProps = {
  headline: string;
  carsText: string;
  model: string;
  vehicle: string;
  totalValueLabel: string;
  totalValueText: string;
  shortfallText: string;
  asOfText: string;
};

// 공유 이미지 캡처 전용 카드. 화면 밖에 렌더링해 두고 captureRef로 캡처한다.
// 다크모드와 무관하게 항상 브랜드 색 고정.
const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(props, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Text style={styles.appName}>TSLA4Tesla</Text>
      <Text style={styles.headline}>{props.headline}</Text>
      <Text style={styles.carsText}>{props.carsText}</Text>
      <Text style={styles.model}>{props.model}</Text>
      <View style={styles.silhouette}>
        <VehicleSilhouette vehicle={props.vehicle} />
      </View>
      <View style={styles.divider} />
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{props.totalValueLabel}</Text>
        <Text style={styles.detailValue}>{props.totalValueText}</Text>
      </View>
      <Text style={styles.shortfall}>{props.shortfallText}</Text>
      <Text style={styles.footer}>{props.asOfText}</Text>
    </View>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: BRAND_RED,
    borderRadius: 16,
    padding: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  headline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  carsText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  model: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  silhouette: {
    alignItems: 'center',
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  shortfall: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 14,
  },
  footer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
});
