import React, { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { silhouetteFor, type SilhouetteKind } from '../lib/share-card';
import { BrandCard } from '../kit/share/BrandCard';

const BRAND_RED = '#E82127';
const CARD_WIDTH = 360;

// 자체 제작 차량 실루엣 (Tesla 공식 에셋/사진 미사용 - 저작권/상표 이슈 회피)
// 실차 제원(전장/휠베이스/전고/타이어 지름, mm)을 같은 비율로 축소해 그렸다.
// windows/seams 는 카드 배경색으로 칠해 바디를 뚫는 효과를 내고, pillars/mirror 는 그 위에 바디색으로 덮는다.
const SILHOUETTES: Record<
  SilhouetteKind,
  {
    body: string;
    windows: string[];
    pillars: string[];
    mirror: string;
    seams: string[];
    wheels: number[];
    wheelY: number;
    wheelR: number;
    rimR: number;
  }
> = {
  model3: {
    body: 'M11 69.9 C10.2 67.9 8.9 66.2 8.4 64 C7.9 61.9 7.7 59.5 8 57.1 C8.3 54.7 6.8 51.8 10.4 49.8 C14 47.8 22.8 46.7 29.6 45.2 C36.4 43.7 44.5 42.3 51.2 40.7 C57.9 39.1 63.6 37.2 69.8 35.5 C80.2 29.2 92.9 20.2 100.9 16.7 C109 13.2 111.4 14.7 118.2 14.7 C125.1 14.7 133.3 15.1 142 16.7 C150.6 18.3 161.4 22.1 170.1 24.5 C178.7 26.9 187.9 29.6 193.8 31 C199.8 32.3 201.6 32.1 205.5 32.7 C207.5 33.9 210.3 33.8 211.4 36.2 C212.4 38.5 212.1 43.1 212 46.7 C211.9 50.4 211.6 54.5 210.9 58 C210.3 61.4 209.1 65.5 208.1 67.5 C207.1 69.5 206.1 69.1 205.1 69.9 L182.9 70.5 A16.4 16.4 0 1 0 154.2 70.5 L58.6 70.5 A16.4 16.4 0 1 0 30 70.5 Z',
    windows: ['M75.4 33.3 C84.2 28.5 94.6 21.5 101.8 18.9 C109 16.3 112.1 17.7 118.6 17.8 C125.2 17.9 133.3 18.1 141.1 19.5 C148.9 21 158.8 24.5 165.3 26.4 C171.8 28.3 175.1 29.4 180 30.8 L75.4 33.3 Z'],
    pillars: ['M124.3 34.2 L127.7 34.2 L128.6 16.5 L125.1 16.5 Z'],
    mirror: 'M81.5 32.5 C81.5 31.2 82.2 29.4 81.5 28.6 C80.8 27.8 78.7 27.7 77.2 27.7 C75.6 27.8 73.3 28.4 72.4 29 C71.5 29.7 71.5 31 72 31.6 C72.5 32.2 73.8 32.6 75.4 32.7 C77 32.8 79.5 32.6 81.5 32.5 Z',
    seams: [],
    wheels: [44.3, 168.6],
    wheelY: 62.6,
    wheelR: 14.4,
    rimR: 9.9,
  },
  modelY: {
    body: 'M11.2 68.8 C10.3 66.6 8.9 64.5 8.3 62 C7.8 59.5 7.5 56.7 8 53.8 C8.5 50.9 7.6 46.7 11.4 44.4 C15.3 42.1 24.6 41.5 31.2 40.1 C37.8 38.7 44.9 37.5 50.9 36 C56.9 34.5 61.8 32.6 67.3 30.8 C78.3 23.8 90.9 13.7 100.3 9.8 C109.8 5.9 115.3 7.4 123.9 7.3 C132.5 7.1 142.9 7.5 151.8 8.7 C160.8 10 169.9 12.4 177.6 14.7 C185.3 17.1 192.8 21.1 197.8 22.9 C202.7 24.7 204.1 24.6 207.2 25.5 C208.7 27.2 210.7 27.8 211.5 30.6 C212.3 33.5 212.1 38.5 212 42.6 C211.9 46.8 211.7 51.5 211 55.5 C210.3 59.5 208.7 64.5 207.7 66.7 C206.6 68.9 205.7 68.1 204.7 68.8 L185.3 69.5 A17.4 17.4 0 1 0 154.1 69.5 L61.2 69.5 A17.4 17.4 0 1 0 30 69.5 Z',
    windows: ['M72.4 29.1 C82 23.5 92.6 15.3 101.2 12.2 C109.8 9 115.5 10.3 123.9 10.2 C132.4 10.1 143 10.4 151.8 11.6 C160.6 12.9 169.7 15.4 176.7 17.5 C183.8 19.7 188.2 22.3 193.9 24.6 L72.4 29.1 Z'],
    pillars: ['M126.9 30.6 L130.8 30.6 L131.7 8.7 L127.8 8.7 Z', 'M167.7 29.8 L170.7 29.8 L174.6 15 L171.6 15 Z'],
    mirror: 'M80.1 28.9 C80.1 27.6 80.9 25.8 80.1 25 C79.4 24.3 77.3 24.1 75.8 24.2 C74.3 24.3 72 24.8 71.1 25.5 C70.3 26.1 70.2 27.4 70.7 28.1 C71.2 28.7 72.6 29 74.1 29.1 C75.7 29.3 78.1 29 80.1 28.9 Z',
    seams: [],
    wheels: [45.6, 169.7],
    wheelY: 61.7,
    wheelR: 15.3,
    rimR: 10.4,
  },
  modelS: {
    body: 'M11.1 70.8 C10.2 68.9 8.9 67 8.4 65.1 C7.9 63.2 7.6 61.5 8 59.4 C8.4 57.2 7 54.2 11.1 52.2 C15.2 50.2 25.6 49 32.6 47.4 C39.6 45.9 46.3 44.6 53.2 43.1 C60 41.7 66.8 40.1 73.7 38.6 C84.6 32.3 98.3 23 106.5 19.5 C114.7 16 116.6 17.7 122.9 17.7 C129.3 17.6 136.8 17.8 144.7 19.2 C152.6 20.6 162 23.5 170.1 25.9 C178.3 28.3 187.6 31.8 193.5 33.4 C199.4 35 201.5 34.8 205.4 35.5 C207.4 36.6 210.2 36.6 211.3 38.8 C212.4 41 212 45.3 212 48.7 C212 52 211.6 55.6 211 58.9 C210.3 62.3 209.1 66.8 208.1 68.8 C207.1 70.8 206 70.2 205 70.8 L181.2 71.9 A16.3 16.3 0 1 0 154.5 71.9 L59.7 71.9 A16.3 16.3 0 1 0 33 71.9 Z',
    windows: ['M79 36.4 C88.5 31.5 99.9 24.4 107.3 21.8 C114.7 19.2 117.1 20.5 123.3 20.6 C129.6 20.6 137.2 20.8 144.7 22 C152.1 23.2 161.2 26 168.1 27.9 C175 29.9 180.1 31.6 186.1 33.5 L79 36.4 Z'],
    pillars: ['M127 37.6 L130.5 37.6 L131.3 19.1 L127.9 19.1 Z', 'M165.2 37.2 L168.1 37.2 L171 26.9 L168.1 26.9 Z'],
    mirror: 'M83.9 36 C83.9 34.7 84.6 33 83.9 32.3 C83.3 31.5 81.3 31.4 79.8 31.4 C78.4 31.5 76.1 32.1 75.3 32.7 C74.5 33.3 74.4 34.6 74.9 35.1 C75.4 35.7 76.7 36 78.2 36.2 C79.7 36.3 82 36 83.9 36 Z',
    seams: [],
    wheels: [46.4, 167.9],
    wheelY: 62.6,
    wheelR: 14.4,
    rimR: 9.9,
  },
  modelX: {
    body: 'M11.2 68.9 C10.3 66.5 8.8 64.2 8.3 61.7 C7.8 59.1 7.4 56.4 8.2 53.6 C9 50.8 8.7 47.2 12.8 45.1 C17 43 26.4 42.4 33 41.1 C39.6 39.8 46.9 38.4 52.4 37.1 C57.8 35.7 61.2 34.4 65.7 33 C73.4 28.3 80.5 22.6 88.7 18.9 C96.9 15.2 106.8 12.3 114.9 10.6 C123 9 129.4 9.2 137.1 9.2 C144.8 9.3 153.6 9.8 161.3 11 C169 12.3 176.9 14.6 183.5 16.9 C190.1 19.1 196.8 22.9 200.8 24.6 C204.9 26.2 205.4 26.2 207.7 27 C209 28.7 210.8 29.3 211.5 32.2 C212.2 35.2 212.1 40.7 212 44.7 C211.9 48.8 211.6 52.7 210.9 56.4 C210.2 60.2 208.7 65 207.7 67.1 C206.7 69.2 205.8 68.3 204.9 68.9 L181.1 70.3 A16.9 16.9 0 1 0 151.5 70.3 L61.5 70.3 A16.9 16.9 0 1 0 31.9 70.3 Z',
    windows: ['M70.9 31 C77.5 27 83.4 22 90.7 18.9 C98 15.8 107.2 13.6 114.9 12.5 C122.6 11.3 129.5 11.8 137.1 12.1 C144.7 12.3 153 12.6 160.5 13.9 C168 15.1 176.4 17.6 182.3 19.5 C188.2 21.5 191.4 23.5 196 25.6 L70.9 31 Z'],
    pillars: ['M111.3 33 L114.9 33 L116.1 11.9 L112.5 11.9 Z', 'M170.2 30.6 L173 30.6 L176.2 15.7 L173.4 15.7 Z'],
    mirror: 'M76.6 30.2 C76.6 29 77.3 27.3 76.6 26.6 C75.9 25.8 74 25.7 72.5 25.8 C71.1 25.8 68.9 26.4 68.1 27 C67.3 27.6 67.2 28.8 67.7 29.4 C68.2 30 69.5 30.3 70.9 30.4 C72.4 30.5 74.7 30.3 76.6 30.2 Z',
    seams: [],
    wheels: [46.7, 166.3],
    wheelY: 62.1,
    wheelR: 14.9,
    rimR: 10.2,
  },
  cybertruck: {
    body: 'M11.2 61.2 L8 39.7 L103.1 12.7 L212 35.7 L211.4 58.3 L207.6 61.2 L198.5 62.6 L197 52.3 L189 43 L169.3 43 L161.2 52.3 L159.8 62.6 L61.8 62.6 L60.4 52.3 L52.3 43 L32.6 43 L24.5 52.3 L23.1 62.6 Z',
    windows: ['M59.9 28.2 L103.1 16 L149.8 25.8 L147.3 28.2 Z'],
    pillars: ['M101.3 29.3 L104.6 29.3 L104.6 14.5 L101.3 14.5 Z'],
    mirror: 'M70.5 28.2 L71.4 25.7 L76.6 25.7 L76.6 28.2 Z',
    seams: ['M154.5 26.3 L209 37.8 L209 38.7 L154.5 27.2 Z'],
    wheels: [42.5, 179.1],
    wheelY: 61.2,
    wheelR: 15.8,
    rimR: 9.1,
  },
};

// 빨강 배경 위 반투명 흰색(0.92)과 같은 불투명색. 겹쳐 그려도 진해지지 않게 덧칠 부위에 쓴다.
const BODY_SOLID = '#FDEDEE';

function VehicleSilhouette({ vehicle }: { vehicle: string }) {
  const { body, windows, pillars, mirror, seams, wheels, wheelY, wheelR, rimR } =
    SILHOUETTES[silhouetteFor(vehicle)];
  return (
    <Svg width={220} height={80} viewBox="0 0 220 80">
      <Path d={body} fill="rgba(255,255,255,0.92)" />
      {windows.map((d) => (
        <Path key={d} d={d} fill={BRAND_RED} />
      ))}
      {pillars.map((d) => (
        <Path key={d} d={d} fill={BODY_SOLID} />
      ))}
      <Path d={mirror} fill={BODY_SOLID} />
      {seams.map((d) => (
        <Path key={d} d={d} fill={BRAND_RED} />
      ))}
      {wheels.map((cx) => (
        <React.Fragment key={cx}>
          <Circle cx={cx} cy={wheelY} r={wheelR} fill="rgba(255,255,255,0.92)" />
          <Circle cx={cx} cy={wheelY} r={rimR} fill={BRAND_RED} />
          <Circle cx={cx} cy={wheelY} r={rimR * 0.32} fill={BODY_SOLID} />
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
  nextTargetText: string;
  shortfallText: string;
  asOfText: string;
};

// 카드 골격(브랜드 색 배경, 앱 이름 헤더, 푸터)은 kit/share/BrandCard가 담당하고
// 여기서는 TSLA4Tesla 고유의 내용만 children으로 채운다.
const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(props, ref) {
  return (
    <BrandCard
      ref={ref}
      brandColor={BRAND_RED}
      appName="TSLA4Tesla"
      footerText={props.asOfText}
      width={CARD_WIDTH}
    >
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
      <Text style={styles.nextTarget}>{props.nextTargetText}</Text>
      <Text style={styles.shortfall}>{props.shortfallText}</Text>
    </BrandCard>
  );
});

export default ShareCard;

const styles = StyleSheet.create({
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
  nextTarget: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  shortfall: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
  },
});
