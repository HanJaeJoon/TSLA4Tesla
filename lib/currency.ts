// 통화 환산 근사 표기. 원화 만/억 단위 표기는 이 앱 고유 규칙이라 kit 이 아니라 lib 에 둔다.

// 원화는 만/억 단위 근사 표기가 관용적이다.
export function formatKrwApprox(usd: number, usdKrwRate: number): string {
  const krw = usd * usdKrwRate;
  const man = Math.round(krw / 1e4);
  // 만 단위 반올림 결과가 1억(10,000만)에 도달하면 억 단위로 표기
  if (krw >= 1e8 || man >= 10000) {
    const eok = (krw / 1e8).toFixed(1).replace(/\.0$/, '');
    return `약 ${eok}억 원`;
  }
  if (krw >= 1e4) {
    return `약 ${man.toLocaleString('ko-KR')}만 원`;
  }
  return `약 ${Math.round(krw).toLocaleString('ko-KR')}원`;
}

// USD 금액을 대상 통화로 환산해 근사 표기한다.
// 한국어 + KRW 조합만 관용적인 만/억 단위 표기를 유지한다.
export function formatApproxConverted(
  usd: number,
  usdRate: number,
  currency: string,
  locale: string
): string {
  if (locale === 'ko' && currency === 'KRW') {
    return formatKrwApprox(usd, usdRate);
  }
  const converted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(usd * usdRate);
  return `≈ ${converted}`;
}
