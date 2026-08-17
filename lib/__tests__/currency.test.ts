import { resolveTargetCurrency, formatApproxConverted } from '../currency';

describe('resolveTargetCurrency', () => {
  it('기기 통화 코드를 대문자로 반환한다', () => {
    expect(resolveTargetCurrency('KRW')).toBe('KRW');
    expect(resolveTargetCurrency('jpy')).toBe('JPY');
    expect(resolveTargetCurrency('EUR')).toBe('EUR');
  });

  it('USD면 환산이 불필요하므로 null을 반환한다', () => {
    expect(resolveTargetCurrency('USD')).toBeNull();
    expect(resolveTargetCurrency('usd')).toBeNull();
  });

  it('통화 코드가 없거나 형식이 잘못되면 null을 반환한다', () => {
    expect(resolveTargetCurrency(null)).toBeNull();
    expect(resolveTargetCurrency(undefined)).toBeNull();
    expect(resolveTargetCurrency('')).toBeNull();
    expect(resolveTargetCurrency('WON')).toBe('WON'); // 3글자 알파벳이면 그대로 신뢰
    expect(resolveTargetCurrency('12$')).toBeNull();
    expect(resolveTargetCurrency('EURO')).toBeNull();
  });
});

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
