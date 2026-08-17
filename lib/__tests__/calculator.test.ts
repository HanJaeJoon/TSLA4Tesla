import {
  parseStockCount,
  calculatePurchase,
  buildHistorySeries,
  formatCurrency,
} from '../calculator';

describe('parseStockCount', () => {
  it('빈 문자열이면 empty 에러 코드를 반환한다', () => {
    expect(parseStockCount('')).toEqual({ ok: false, error: 'empty' });
  });

  it('공백만 있으면 empty 에러 코드를 반환한다', () => {
    expect(parseStockCount('   ')).toEqual({ ok: false, error: 'empty' });
  });

  it('숫자가 아니면 invalid 에러 코드를 반환한다', () => {
    expect(parseStockCount('abc')).toEqual({ ok: false, error: 'invalid' });
  });

  it('0 이하이면 invalid 에러 코드를 반환한다', () => {
    expect(parseStockCount('0')).toEqual({ ok: false, error: 'invalid' });
    expect(parseStockCount('-5')).toEqual({ ok: false, error: 'invalid' });
  });

  it('양수 문자열이면 숫자로 파싱한다', () => {
    expect(parseStockCount('100')).toEqual({ ok: true, value: 100 });
    expect(parseStockCount('12.5')).toEqual({ ok: true, value: 12.5 });
  });
});

describe('calculatePurchase', () => {
  it('총 가치와 구매 가능 대수를 계산한다', () => {
    const result = calculatePurchase(100, 400, 40000);
    expect(result.totalValue).toBe(40000);
    expect(result.numberOfCars).toBe(1);
  });

  it('소수 대수도 그대로 반환한다', () => {
    const result = calculatePurchase(10, 411.78, 38630);
    expect(result.totalValue).toBeCloseTo(4117.8);
    expect(result.numberOfCars).toBeCloseTo(4117.8 / 38630);
  });
});

describe('buildHistorySeries', () => {
  // 2026-01-15 12:00 UTC, 2026-02-15 12:00 UTC (월 중간이라 타임존 영향 없음)
  const JAN = Date.UTC(2026, 0, 15, 12) / 1000;
  const FEB = Date.UTC(2026, 1, 15, 12) / 1000;
  const koMonth = (d: Date) => `${d.getMonth() + 1}월`;

  it('라벨과 구매 가능 대수 시리즈를 만든다', () => {
    const result = buildHistorySeries([JAN, FEB], [400, 500], 100, 40000, koMonth);
    expect(result.labels).toEqual(['1월', '2월']);
    expect(result.values).toEqual([1, 1.25]);
  });

  it('종가가 null인 지점은 제외한다', () => {
    const result = buildHistorySeries([JAN, FEB], [null, 500], 100, 40000, koMonth);
    expect(result.labels).toEqual(['2월']);
    expect(result.values).toEqual([1.25]);
  });

  it('데이터가 없으면 빈 시리즈를 반환한다', () => {
    const result = buildHistorySeries([], [], 100, 40000, koMonth);
    expect(result.labels).toEqual([]);
    expect(result.values).toEqual([]);
  });
});

describe('formatCurrency', () => {
  it('locale 표기법으로 USD 통화를 소수 2자리까지 표시한다', () => {
    const ko = formatCurrency(1234.5, 'ko');
    expect(ko).toContain('1,234.50');
    expect(ko).toMatch(/US?\$/);

    expect(formatCurrency(1234.5, 'en')).toBe('$1,234.50');

    const de = formatCurrency(1234.5, 'de');
    expect(de).toContain('1.234,50');
    expect(de).toContain('$');
  });
});
