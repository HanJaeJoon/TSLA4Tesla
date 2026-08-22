// 라인 차트의 계열(datasets) 구성. 주 계열은 브랜드 색, 추가 계열은 앱이 지정한 색을 쓴다.
// 렌더링과 분리해 두어 계열 구성 규칙만 따로 테스트한다.

// chart-kit 은 선 색 콜백에 1 보다 작은 opacity 를 넘길 때가 있어
// 여러 계열을 겹치면 색이 흐려져 구분이 어렵다. 하한을 둔다.
export const MIN_STROKE_OPACITY = 0.9;

export type ChartSeries = { values: number[]; color: string };

export type ChartDataset = {
  data: number[];
  color: (opacity?: number) => string;
  strokeWidth: number;
};

export function buildChartDatasets(
  values: number[],
  brandColor: string,
  extraSeries?: ChartSeries[]
): ChartDataset[] {
  const strokeOpacity = (opacity: number) => Math.max(opacity, MIN_STROKE_OPACITY);
  return [
    {
      data: values,
      color: (opacity = 1) => hexToRgba(brandColor, strokeOpacity(opacity)),
      strokeWidth: 2,
    },
    ...(extraSeries ?? []).map((series) => ({
      data: series.values,
      color: (opacity = 1) => hexToRgba(series.color, strokeOpacity(opacity)),
      strokeWidth: 2,
    })),
  ];
}

// #RRGGBB -> rgba(r, g, b, a)
export function hexToRgba(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
