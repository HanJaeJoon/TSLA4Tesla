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
    body: 'M17.9 67.7 C15.8 67.2 13 67 11.5 66.2 C9.9 65.4 9 64 8.4 63 C7.9 61.9 7.7 60.9 8 59.7 C8.3 58.5 8.6 57.1 9.9 55.8 C11.2 54.5 12.5 53.6 15.8 51.9 C19.1 50.3 23.7 47.9 29.6 46.1 C35.5 44.3 44.5 42.7 51.2 40.9 C57.9 39.1 63.6 37.3 69.8 35.5 C80.2 29.2 92.9 20.2 100.9 16.7 C109 13.2 111.4 14.7 118.2 14.7 C125.1 14.7 133.3 15.1 142 16.7 C150.6 18.3 161.8 22.2 170.1 24.5 C178.4 26.8 185.9 29.2 191.7 30.3 C197.5 31.5 200.6 31 205.1 31.3 C206.5 32 208.3 32.2 209.4 33.3 C210.5 34.5 211.2 36 211.7 38.1 C212.1 40.2 212.1 43.3 212 45.9 C211.9 48.5 211.6 51.4 211.1 53.7 C210.6 56 210 58 209 59.7 C208 61.4 206.7 63 205.1 64 C203.5 65.1 201.3 65.3 199.5 66 L182.9 70.5 A16.4 16.4 0 1 0 154.2 70.5 L58.6 70.5 A16.4 16.4 0 1 0 30 70.5 Z',
    windows: ['M75.4 33.3 C84.2 28.5 94.6 21.5 101.8 18.9 C109 16.3 112.1 17.7 118.6 17.8 C125.2 17.9 133.3 18.1 141.1 19.5 C148.9 21 158.8 24.5 165.3 26.4 C171.8 28.3 175.1 29.4 180 30.8 L75.4 33.3 Z'],
    pillars: ['M124.3 34.2 L127.7 34.2 L128.6 16.5 L125.1 16.5 Z'],
    mirror: 'M75.4 33.3 C78.9 33.3 84.1 33.8 85.8 33.3 C87.5 32.7 86.1 30.5 85.6 29.9 C85 29.3 84.2 28.9 82.6 29.5 C80.9 30 77.8 32.1 75.4 33.3 Z',
    seams: [],
    wheels: [44.3, 168.6],
    wheelY: 62.6,
    wheelR: 14.4,
    rimR: 9.9,
  },
  modelY: {
    body: 'M18.7 66.7 C16.6 66 13.9 65.6 12.3 64.5 C10.6 63.5 9.6 61.8 8.9 60.3 C8.1 58.8 8 57.1 8 55.5 C8 54 7.9 52.4 8.9 50.8 C9.8 49.2 11.6 47.4 13.6 46.1 C15.6 44.8 17.9 44 20.9 43.1 C23.8 42.1 26.2 41.5 31.2 40.3 C36.2 39.1 44.9 37.6 50.9 36 C56.9 34.4 61.8 32.6 67.3 30.8 C78.3 23.8 90.9 13.7 100.3 9.8 C109.8 5.9 115.3 7.4 123.9 7.3 C132.5 7.1 142.9 7.5 151.8 8.7 C160.8 10 170.2 12.4 177.6 14.7 C185 17 191.4 20.8 196.1 22.5 C200.7 24.2 203.2 24 205.5 24.8 C207.8 25.7 208.8 26.4 209.8 27.6 C210.8 28.9 211.2 30.2 211.5 32.3 C211.9 34.5 212 37.4 212 40.5 C212 43.7 211.7 48.2 211.3 51.2 C210.9 54.2 210.3 56.6 209.4 58.5 C208.4 60.5 207.1 61.8 205.5 62.8 C203.9 63.9 201.8 64.1 199.9 64.8 L185.3 69.5 A17.4 17.4 0 1 0 154.1 69.5 L61.2 69.5 A17.4 17.4 0 1 0 30 69.5 Z',
    windows: ['M72.4 29.1 C82 23.5 92.6 15.3 101.2 12.2 C109.8 9 115.5 10.3 123.9 10.2 C132.4 10.1 143 10.4 151.8 11.6 C160.6 12.9 169.7 15.4 176.7 17.5 C183.8 19.7 188.2 22.3 193.9 24.6 L72.4 29.1 Z'],
    pillars: ['M126.9 30.6 L130.8 30.6 L131.7 8.7 L127.8 8.7 Z', 'M167.7 29.8 L170.7 29.8 L174.6 15 L171.6 15 Z'],
    mirror: 'M72.4 29.1 C75.8 29.1 81 29.6 82.7 29 C84.4 28.4 83.1 26.1 82.5 25.5 C81.9 24.8 81 24.4 79.3 25 C77.6 25.7 74.7 27.8 72.4 29.1 Z',
    seams: [],
    wheels: [45.6, 169.7],
    wheelY: 61.7,
    wheelR: 15.3,
    rimR: 10.4,
  },
  modelS: {
    body: 'M17.9 69.2 C15.7 68.8 12.9 68.6 11.3 67.9 C9.7 67.2 9 65.9 8.4 64.9 C7.9 63.9 7.8 62.9 8 61.8 C8.2 60.7 8.5 59.4 9.8 58.1 C11.1 56.8 12 55.7 15.8 54 C19.6 52.3 26.4 49.9 32.6 48.1 C38.9 46.3 46.3 44.8 53.2 43.3 C60 41.7 66.8 40.2 73.7 38.6 C84.6 32.3 98.3 23 106.5 19.5 C114.7 16 116.6 17.7 122.9 17.7 C129.3 17.6 136.8 17.8 144.7 19.2 C152.6 20.6 162.1 23.6 170.1 25.9 C178.1 28.2 186.8 31.6 192.7 33.1 C198.6 34.6 201.2 34.4 205.4 35.1 C206.8 35.7 208.5 36 209.5 37 C210.6 38 211.2 39 211.6 40.9 C212 42.8 212.1 45.8 212 48.3 C211.9 50.7 211.7 53.5 211.2 55.7 C210.7 57.8 210.1 59.8 209.1 61.4 C208.2 63 206.9 64.5 205.4 65.5 C203.9 66.5 201.9 66.7 200.1 67.4 L181.2 71.9 A16.3 16.3 0 1 0 154.5 71.9 L59.7 71.9 A16.3 16.3 0 1 0 33 71.9 Z',
    windows: ['M79 36.4 C88.5 31.5 99.9 24.4 107.3 21.8 C114.7 19.2 117.1 20.5 123.3 20.6 C129.6 20.6 137.2 20.8 144.7 22 C152.1 23.2 161.2 26 168.1 27.9 C175 29.9 180.1 31.6 186.1 33.5 L79 36.4 Z'],
    pillars: ['M127 37.6 L130.5 37.6 L131.3 19.1 L127.9 19.1 Z', 'M165.2 37.2 L168.1 37.2 L171 26.9 L168.1 26.9 Z'],
    mirror: 'M79 36.4 C82.3 36.3 87.3 36.8 88.9 36.2 C90.5 35.7 89.2 33.5 88.7 32.9 C88.1 32.2 87.2 31.9 85.6 32.5 C84 33 81.2 35.1 79 36.4 Z',
    seams: [],
    wheels: [46.4, 167.9],
    wheelY: 62.6,
    wheelR: 14.4,
    rimR: 9.9,
  },
  modelX: {
    body: 'M18.5 67.3 C16.5 66.7 14 66.5 12.4 65.5 C10.9 64.5 9.7 62.8 9 61.3 C8.3 59.7 8 57.7 8 56 C8 54.3 8 52.8 9 51.2 C10 49.6 11.9 47.6 14.1 46.3 C16.2 45.1 19 44.5 22.1 43.7 C25.3 42.9 28 42.6 33 41.5 C38.1 40.4 46.9 38.7 52.4 37.3 C57.8 35.9 61.2 34.4 65.7 33 C73.4 28.3 80.5 22.6 88.7 18.9 C96.9 15.2 106.8 12.3 114.9 10.6 C123 9 129.4 9.2 137.1 9.2 C144.8 9.3 153.6 9.8 161.3 11 C169 12.3 177.1 14.7 183.5 16.9 C189.9 19.1 195.9 22.5 199.6 24.2 C203.3 25.8 204 25.6 205.7 26.6 C207.3 27.5 208.7 28.5 209.7 29.8 C210.7 31.1 211.1 32.5 211.5 34.6 C211.9 36.8 212 39.7 212 42.7 C212 45.7 211.8 50 211.3 52.8 C210.9 55.6 210.2 57.8 209.3 59.7 C208.4 61.5 207.1 62.9 205.7 63.9 C204.2 64.9 202.2 65 200.4 65.5 L181.1 70.3 A16.9 16.9 0 1 0 151.5 70.3 L61.5 70.3 A16.9 16.9 0 1 0 31.9 70.3 Z',
    windows: ['M70.9 31 C77.5 27 83.4 22 90.7 18.9 C98 15.8 107.2 13.6 114.9 12.5 C122.6 11.3 129.5 11.8 137.1 12.1 C144.7 12.3 153 12.6 160.5 13.9 C168 15.1 176.4 17.6 182.3 19.5 C188.2 21.5 191.4 23.5 196 25.6 L70.9 31 Z'],
    pillars: ['M111.3 33 L114.9 33 L116.1 11.9 L112.5 11.9 Z', 'M170.2 30.6 L173 30.6 L176.2 15.7 L173.4 15.7 Z'],
    mirror: 'M70.9 31 C74.2 31 79 31.5 80.6 30.9 C82.2 30.3 80.9 28.2 80.4 27.6 C79.9 27 79 26.6 77.4 27.2 C75.8 27.8 73.1 29.7 70.9 31 Z',
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
