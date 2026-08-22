import {
  assertLegendLength,
  buildChartDatasets,
  hexToRgba,
  MIN_STROKE_OPACITY,
} from '../chart/chartDatasets';

describe('buildChartDatasets', () => {
  it('extraSeries가 없으면 주 계열 하나만 만든다', () => {
    const datasets = buildChartDatasets([1, 2, 3], '#E82127');
    expect(datasets).toHaveLength(1);
    expect(datasets[0].data).toEqual([1, 2, 3]);
    expect(datasets[0].strokeWidth).toBe(2);
  });

  it('extraSeries를 주면 그 개수만큼 계열이 늘어나고 순서가 유지된다', () => {
    const datasets = buildChartDatasets([1, 2], '#E82127', [
      { values: [3, 4], color: '#00AA00' },
      { values: [5, 6], color: '#0000FF' },
    ]);
    expect(datasets).toHaveLength(3);
    expect(datasets.map((d) => d.data)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('주 계열은 브랜드 색, 추가 계열은 각자 지정한 색을 쓴다', () => {
    const datasets = buildChartDatasets([1], '#E82127', [{ values: [2], color: '#00AA00' }]);
    expect(datasets[0].color(1)).toBe('rgba(232, 33, 39, 1)');
    expect(datasets[1].color(1)).toBe('rgba(0, 170, 0, 1)');
  });

  it('선 색 opacity에 하한을 둬서 계열이 겹쳐도 색이 흐려지지 않는다', () => {
    const datasets = buildChartDatasets([1], '#E82127', [{ values: [2], color: '#00AA00' }]);
    // chart-kit이 0.2 같은 낮은 opacity를 넘겨도 하한까지만 내려간다
    expect(datasets[0].color(0.2)).toBe(`rgba(232, 33, 39, ${MIN_STROKE_OPACITY})`);
    expect(datasets[1].color(0.2)).toBe(`rgba(0, 170, 0, ${MIN_STROKE_OPACITY})`);
    // 하한보다 큰 값은 그대로 쓴다
    expect(datasets[0].color(1)).toBe('rgba(232, 33, 39, 1)');
  });

  it('opacity 인자가 없으면 1로 본다', () => {
    const datasets = buildChartDatasets([1], '#E82127');
    expect(datasets[0].color()).toBe('rgba(232, 33, 39, 1)');
  });
});

describe('hexToRgba', () => {
  it('#RRGGBB를 rgba 표기로 바꾼다', () => {
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('#RRGGBB가 아니면 throw한다', () => {
    expect(() => hexToRgba('E82127', 1)).toThrow(/expected #RRGGBB/);
    expect(() => hexToRgba('#FFF', 1)).toThrow(/expected #RRGGBB/);
    expect(() => hexToRgba('#FFFFFFF', 1)).toThrow(/expected #RRGGBB/);
    expect(() => hexToRgba('#GGGGGG', 1)).toThrow(/expected #RRGGBB/);
    expect(() => hexToRgba('', 1)).toThrow(/expected #RRGGBB/);
  });
});

describe('assertLegendLength', () => {
  it('legend가 없거나 dataset 수 이하면 통과한다', () => {
    expect(() => assertLegendLength(undefined)).not.toThrow();
    expect(() => assertLegendLength([])).not.toThrow();
    expect(() => assertLegendLength(['주'])).not.toThrow();
    expect(() => assertLegendLength(['주', '추가'], [{ values: [1], color: '#00AA00' }])).not.toThrow();
  });

  it('legend가 dataset 수보다 길면 throw한다', () => {
    expect(() => assertLegendLength(['a', 'b'])).toThrow(
      'ThemedLineChart: legend length exceeds dataset count'
    );
    expect(() =>
      assertLegendLength(['a', 'b', 'c'], [{ values: [1], color: '#00AA00' }])
    ).toThrow('ThemedLineChart: legend length exceeds dataset count');
  });
});
