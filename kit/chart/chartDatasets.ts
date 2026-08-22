// 라인 차트의 계열(datasets) 구성. 주 계열은 브랜드 색, 추가 계열은 앱이 지정한 색을 쓴다.
// 렌더링과 분리해 두어 계열 구성 규칙만 따로 테스트한다.

// chart-kit 은 선 색 콜백에 1 보다 작은 opacity 를 넘길 때가 있어
// 여러 계열을 겹치면 색이 흐려져 구분이 어렵다. 하한을 둔다.
export const MIN_STROKE_OPACITY = 0.9;

export type ChartSeries = {
  values: number[];
  /** `#RRGGBB` */
  color: string;
};

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

/**
 * chart-kit 의 renderLegend 는 datasets[i] 색을 쓰므로
 * legend 가 dataset 수보다 길면 런타임 예외가 난다.
 * LineChart 에 넘기기 전에 호출한다.
 */
export function assertLegendLength(
  legend: string[] | undefined,
  extraSeries?: ChartSeries[]
): void {
  const datasetCount = 1 + (extraSeries?.length ?? 0);
  if (legend != null && legend.length > datasetCount) {
    throw new Error('ThemedLineChart: legend length exceeds dataset count');
  }
}

/**
 * `#RRGGBB` 만 받는다. `#RGB`, `#RRGGBBAA`, `#` 없는 값은 throw.
 */
export function hexToRgba(hex: string, opacity: number): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(`hexToRgba: expected #RRGGBB, got ${JSON.stringify(hex)}`);
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
