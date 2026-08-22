import React from 'react';
import { ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatDecimal } from '../currency';
import { ThemeColors } from '../theme';
import {
  assertLegendLength,
  buildChartDatasets,
  ChartSeries,
  hexToRgba,
} from './chartDatasets';
import { yAxisDecimalPlaces } from './yAxisDecimalPlaces';

export function ThemedLineChart(props: {
  labels: string[];
  values: number[];
  /**
   * 주 계열과 함께 그릴 추가 계열. 방식별 비교처럼 여러 곡선을 겹칠 때 쓴다.
   * 색은 앱이 지정한다 - kit 은 브랜드 색 외의 팔레트를 모른다.
   */
  extraSeries?: ChartSeries[];
  /** 계열 이름. 주 계열부터 extraSeries 순서로 대응한다. */
  legend?: string[];
  width: number;
  height?: number;
  yAxisSuffix?: string;
  // Y축 숫자 라벨을 locale 표기법(소수 구분자 등)으로 표시한다. 없으면 기본 표기(점)
  locale?: string;
  brandColor: string;
  colors: ThemeColors;
  // react-native-chart-kit의 style prop은 Partial<ViewStyle>만 받는다 (StyleProp 불가)
  style?: Partial<ViewStyle>;
  /** 점을 숨긴다. 회차가 많아 점이 뭉개질 때 쓴다. */
  hideDots?: boolean;
  /**
   * 곡선 아래 면 채움을 끈다.
   *
   * chart-kit 은 면을 chartConfig.color 로 칠하기 때문에 계열마다 색을 줘도
   * 면이 겹쳐 곡선 색이 묻힌다. 여러 계열을 겹칠 때는 꺼야 구분이 된다.
   */
  hideFill?: boolean;
}) {
  const { colors, brandColor, locale } = props;
  assertLegendLength(props.legend, props.extraSeries);
  // chart-kit 은 Y축 min/max 를 전 계열 합집합으로 잡는다. 주 계열만 보면
  // 주 계열 범위가 거칠고 실제 축 범위가 작을 때 라벨이 전부 0.0 으로 뭉개진다.
  const allValues = [
    ...props.values,
    ...(props.extraSeries ?? []).flatMap((s) => s.values),
  ];
  const decimalPlaces = yAxisDecimalPlaces(allValues);
  const datasets = buildChartDatasets(props.values, brandColor, props.extraSeries);
  return (
    <LineChart
      data={{ labels: props.labels, datasets, legend: props.legend }}
      width={props.width}
      height={props.height ?? 220}
      yAxisSuffix={props.yAxisSuffix ?? ''}
      yAxisInterval={1}
      withDots={!props.hideDots}
      withShadow={!props.hideFill}
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
