import { formatDecimal } from '../currency';
import { yAxisDecimalPlaces } from '../chart/yAxisDecimalPlaces';

describe('yAxisDecimalPlaces', () => {
  it('값 범위가 충분히 크면 기존 표기(소수 1자리)를 유지한다', () => {
    // 주식 100주 규모: 구매 가능 대수 20~30대, step 2.5
    expect(yAxisDecimalPlaces([20, 24, 30])).toBe(1);
    // step이 정확히 0.1이어도 1자리로 구별된다
    expect(yAxisDecimalPlaces([1.0, 1.2, 1.4])).toBe(1);
  });

  it('값 범위가 작으면 라벨이 구별되도록 자릿수를 늘린다', () => {
    // 주식 1주 규모: 구매 가능 대수 0.006~0.012대, step 0.0015 -> 3자리
    expect(yAxisDecimalPlaces([0.006, 0.009, 0.012])).toBe(3);
    // step 0.05 -> 2자리
    expect(yAxisDecimalPlaces([0.1, 0.2, 0.3])).toBe(2);
    // step 0.025 -> 2자리
    expect(yAxisDecimalPlaces([0.4, 0.45, 0.5])).toBe(2);
  });

  it('자릿수는 라벨 폭이 넘치지 않게 4자리로 제한한다', () => {
    expect(yAxisDecimalPlaces([0.00001, 0.00002])).toBe(4);
  });

  it('값이 전부 같으면 그 값이 0으로 뭉개지지 않는 자릿수를 고른다', () => {
    expect(yAxisDecimalPlaces([0.012, 0.012, 0.012])).toBe(2);
    expect(yAxisDecimalPlaces([5, 5, 5])).toBe(1);
    expect(yAxisDecimalPlaces([0, 0, 0])).toBe(1);
  });

  it('빈 배열이나 유효하지 않은 값만 있으면 기본값 1을 돌려준다', () => {
    expect(yAxisDecimalPlaces([])).toBe(1);
    expect(yAxisDecimalPlaces([NaN, Infinity])).toBe(1);
  });

  it('formatDecimal과 함께 쓰면 de/es 라벨은 쉼표 소수 구분자로 나온다', () => {
    const values = [0.006, 0.009, 0.012];
    const digits = yAxisDecimalPlaces(values);
    // chart-kit이 toFixed로 만든 문자열을 Number로 되돌려 locale 표기로 바꾸는 경로 재현
    const label = formatDecimal(Number((0.009).toFixed(digits)), 'de', digits);
    expect(label).toBe('0,009');
    expect(formatDecimal(Number((0.009).toFixed(digits)), 'en', digits)).toBe('0.009');
  });
});
