// 통화 표기 유틸. 앱 도메인(주가/차량 가격 등)과 무관하다.

// 환산 대상 통화를 결정한다. USD 지역이거나 통화를 알 수 없으면 null (환산 표시 생략).
export function resolveTargetCurrency(
  currencyCode: string | null | undefined
): string | null {
  if (!currencyCode || !/^[A-Za-z]{3}$/.test(currencyCode)) return null;
  const upper = currencyCode.toUpperCase();
  return upper === 'USD' ? null : upper;
}

export function formatCurrency(
  amount: number,
  locale: string,
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// 소수 자릿수를 고정해 locale 표기법으로 숫자를 표시한다 (예: en 110.9 / de 110,9).
export function formatDecimal(
  value: number,
  locale: string,
  fractionDigits: number
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
