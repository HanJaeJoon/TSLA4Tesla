import {
  parseStockCount,
  calculatePurchase,
  buildHistorySeries,
  formatCurrency,
} from '../calculator';

describe('parseStockCount', () => {
  it('빈 문자열이면 입력 요청 에러를 반환한다', () => {
    expect(parseStockCount('')).toEqual({
      ok: false,
      error: '주식 수를 입력해주세요',
    });
  });

  it('공백만 있으면 입력 요청 에러를 반환한다', () => {
    expect(parseStockCount('   ')).toEqual({
      ok: false,
      error: '주식 수를 입력해주세요',
    });
  });

  it('숫자가 아니면 유효성 에러를 반환한다', () => {
    expect(parseStockCount('abc')).toEqual({
      ok: false,
      error: '유효한 주식 수를 입력해주세요 (양수)',
    });
  });

  it('0 이하이면 유효성 에러를 반환한다', () => {
    expect(parseStockCount('0')).toEqual({
      ok: false,
      error: '유효한 주식 수를 입력해주세요 (양수)',
    });
    expect(parseStockCount('-5')).toEqual({
      ok: false,
      error: '유효한 주식 수를 입력해주세요 (양수)',
    });
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

  it('월 라벨과 구매 가능 대수 시리즈를 만든다', () => {
    const result = buildHistorySeries([JAN, FEB], [400, 500], 100, 40000);
    expect(result.labels).toEqual(['1월', '2월']);
    expect(result.values).toEqual([1, 1.25]);
  });

  it('종가가 null인 지점은 제외한다', () => {
    const result = buildHistorySeries([JAN, FEB], [null, 500], 100, 40000);
    expect(result.labels).toEqual(['2월']);
    expect(result.values).toEqual([1.25]);
  });

  it('데이터가 없으면 빈 시리즈를 반환한다', () => {
    const result = buildHistorySeries([], [], 100, 40000);
    expect(result.labels).toEqual([]);
    expect(result.values).toEqual([]);
  });
});

describe('formatCurrency', () => {
  it('USD 통화로 소수 2자리까지 표시한다', () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain('1,234.50');
    expect(formatted).toMatch(/US?\$/);
  });
});
