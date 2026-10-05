import { formatApproxConverted, formatKrwApprox } from '../currency';

describe('formatApproxConverted', () => {
  it('한국어 + KRW는 기존 만/억 단위 표기를 사용한다', () => {
    expect(formatApproxConverted(10000, 1400, 'KRW', 'ko')).toBe('약 1,400만 원');
    expect(formatApproxConverted(100000, 1400, 'KRW', 'ko')).toBe('약 1.4억 원');
  });

  it('그 외 locale은 해당 통화의 Intl 포맷으로 근사 표기한다', () => {
    const jpy = formatApproxConverted(100000, 140, 'JPY', 'ja');
    expect(jpy.startsWith('≈')).toBe(true);
    expect(jpy).toContain('14,000,000');

    const eur = formatApproxConverted(1000, 0.9, 'EUR', 'de');
    expect(eur.startsWith('≈')).toBe(true);
    expect(eur).toContain('900');
    expect(eur).toContain('€');
  });

  it('소수점 없이 반올림한다', () => {
    const krwForEn = formatApproxConverted(1, 1413.06, 'KRW', 'en');
    expect(krwForEn).toContain('1,413');
    expect(krwForEn).not.toContain('.');
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
