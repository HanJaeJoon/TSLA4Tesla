// 기기 지역 통화 기준의 환산 표시를 위한 유틸.
// 가격 데이터(주가, 차량 가격)는 항상 USD이고, 환산은 보조 표시일 뿐이다.

import { formatKrwApprox } from './calculator';

// 환산 대상 통화를 결정한다. USD 지역이거나 통화를 알 수 없으면 null (환산 표시 생략).
export function resolveTargetCurrency(
  currencyCode: string | null | undefined
): string | null {
  if (!currencyCode || !/^[A-Za-z]{3}$/.test(currencyCode)) return null;
  const upper = currencyCode.toUpperCase();
  return upper === 'USD' ? null : upper;
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
