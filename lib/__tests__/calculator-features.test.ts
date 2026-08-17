import {
  shortfallToNextCar,
  formatKrwApprox,
  getPeriodConfig,
  decimateLabels,
  buildHistorySeries,
} from '../calculator';

describe('shortfallToNextCar', () => {
  it('다음 1대까지 부족한 주식 수와 금액을 계산한다', () => {
    // 100주 x $400 = $40,000, 차량 $38,630 -> 1.03대, 다음 목표 2대
    const result = shortfallToNextCar(100, 400, 38630);
    expect(result.targetCars).toBe(2);
    expect(result.neededValue).toBeCloseTo(2 * 38630 - 40000);
    expect(result.neededShares).toBeCloseTo((2 * 38630 - 40000) / 400);
  });

  it('1대 미만이면 1대를 목표로 한다', () => {
    // 10주 x $400 = $4,000, 차량 $38,630 -> 0.10대, 목표 1대
    const result = shortfallToNextCar(10, 400, 38630);
    expect(result.targetCars).toBe(1);
    expect(result.neededValue).toBeCloseTo(38630 - 4000);
  });

  it('정확히 정수 대수이면 그 다음 대수를 목표로 한다', () => {
    // $38,630 x 2 어치 보유 -> 2.00대, 목표 3대
    const result = shortfallToNextCar(2 * 38630 / 400, 400, 38630);
    expect(result.targetCars).toBe(3);
    expect(result.neededValue).toBeCloseTo(38630);
  });
});

describe('formatKrwApprox', () => {
  it('만 원 단위로 반올림해 표시한다', () => {
    // 41178 * 1390 = 57,237,420 -> 5,723.742만 -> 5,724만
    expect(formatKrwApprox(41178, 1390)).toBe('약 5,724만 원');
  });

  it('1억 원 이상이면 억 단위로 표시한다', () => {
    // 100000 * 1390 = 139,000,000 -> 1.4억
    expect(formatKrwApprox(100000, 1390)).toBe('약 1.4억 원');
  });

  it('1만 원 미만이면 원 단위로 표시한다', () => {
    // 5 * 1390 = 6,950
    expect(formatKrwApprox(5, 1390)).toBe('약 6,950원');
  });

  it('만 단위 반올림이 1억이 되면 억 단위로 표시한다', () => {
    // 71942 * 1390 = 99,999,380 -> 9,999.938만 -> "10,000만 원"이 아니라 "1억 원"
    expect(formatKrwApprox(71942, 1390)).toBe('약 1억 원');
  });
});

describe('getPeriodConfig', () => {
  it('1M은 1일 간격, 일 단위 라벨을 쓴다', () => {
    const config = getPeriodConfig('1M');
    expect(config.range).toBe('1mo');
    expect(config.interval).toBe('1d');
    expect(config.formatLabel(new Date(2026, 7, 17))).toBe('17일');
  });

  it('6M은 1주 간격, 월 단위 라벨을 쓴다', () => {
    const config = getPeriodConfig('6M');
    expect(config.range).toBe('6mo');
    expect(config.interval).toBe('1wk');
    expect(config.formatLabel(new Date(2026, 7, 17))).toBe('8월');
  });

  it('1Y는 1개월 간격, 월 단위 라벨을 쓴다', () => {
    const config = getPeriodConfig('1Y');
    expect(config.range).toBe('1y');
    expect(config.interval).toBe('1mo');
    expect(config.formatLabel(new Date(2026, 0, 15))).toBe('1월');
  });

  it('5Y는 3개월 간격, 연.월 라벨을 쓴다', () => {
    const config = getPeriodConfig('5Y');
    expect(config.range).toBe('5y');
    expect(config.interval).toBe('3mo');
    expect(config.formatLabel(new Date(2024, 7, 1))).toBe('24.8');
  });
});

describe('decimateLabels', () => {
  it('최대 개수를 넘으면 일부만 남기고 빈 문자열로 바꾼다', () => {
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const result = decimateLabels(labels, 6);
    expect(result).toHaveLength(12);
    expect(result).toEqual(['a', '', 'c', '', 'e', '', 'g', '', 'i', '', 'k', '']);
  });

  it('최대 개수 이하이면 그대로 반환한다', () => {
    expect(decimateLabels(['a', 'b', 'c'], 6)).toEqual(['a', 'b', 'c']);
  });
});

describe('buildHistorySeries (커스텀 라벨)', () => {
  const AUG17 = Date.UTC(2026, 7, 17, 12) / 1000;

  it('formatLabel을 넘기면 그 형식으로 라벨을 만든다', () => {
    const result = buildHistorySeries(
      [AUG17],
      [400],
      100,
      40000,
      (d) => `${d.getDate()}일`
    );
    expect(result.labels).toEqual(['17일']);
  });
});
