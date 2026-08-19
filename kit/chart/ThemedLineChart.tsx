import React from 'react';
import { ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemeColors } from '../theme';

export function ThemedLineChart(props: {
  labels: string[];
  values: number[];
  width: number;
  height?: number;
  yAxisSuffix?: string;
  brandColor: string;
  colors: ThemeColors;
  // react-native-chart-kit의 style prop은 Partial<ViewStyle>만 받는다 (StyleProp 불가)
  style?: Partial<ViewStyle>;
}) {
  const { colors, brandColor } = props;
  return (
    <LineChart
      data={{ labels: props.labels, datasets: [{ data: props.values }] }}
      width={props.width}
      height={props.height ?? 220}
      yAxisSuffix={props.yAxisSuffix ?? ''}
      yAxisInterval={1}
      chartConfig={{
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces: 1,
        color: (opacity = 1) => hexToRgba(brandColor, opacity),
        labelColor: () => colors.subtext,
        propsForDots: { r: '4', strokeWidth: '2', stroke: brandColor },
        propsForBackgroundLines: { stroke: colors.chartGrid },
      }}
      bezier
      style={props.style}
    />
  );
}

// #RRGGBB -> rgba(r, g, b, a)
function hexToRgba(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
