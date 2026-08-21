import React from 'react';
import { ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatDecimal } from '../currency';
import { ThemeColors } from '../theme';
import { yAxisDecimalPlaces } from './yAxisDecimalPlaces';

export function ThemedLineChart(props: {
  labels: string[];
  values: number[];
  width: number;
  height?: number;
  yAxisSuffix?: string;
  // Y축 숫자 라벨을 locale 표기법(소수 구분자 등)으로 표시한다. 없으면 기본 표기(점)
  locale?: string;
  brandColor: string;
  colors: ThemeColors;
  // react-native-chart-kit의 style prop은 Partial<ViewStyle>만 받는다 (StyleProp 불가)
  style?: Partial<ViewStyle>;
}) {
  const { colors, brandColor, locale } = props;
  // 값 범위가 작을 때 Y축 라벨이 전부 0.0으로 뭉개지지 않도록 자릿수를 동적으로 정한다
  const decimalPlaces = yAxisDecimalPlaces(props.values);
  return (
    <LineChart
      data={{ labels: props.labels, datasets: [{ data: props.values }] }}
      width={props.width}
      height={props.height ?? 220}
      yAxisSuffix={props.yAxisSuffix ?? ''}
      yAxisInterval={1}
      // chart-kit이 toFixed로 만든 라벨을 locale 소수 구분자 표기로 바꾼다 (de/es는 쉼표)
      formatYLabel={
        locale ? (yLabel) => formatDecimal(Number(yLabel), locale, decimalPlaces) : undefined
      }
      chartConfig={{
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        decimalPlaces,
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
