// 에러 문구는 UI 레이어에서 코드 기반으로 번역한다 (lib은 i18n 비의존)
export type StockCountError = 'empty' | 'invalid';

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; error: StockCountError };

export function parseStockCount(input: string): ParseResult {
  if (!input.trim()) {
    return { ok: false, error: 'empty' };
  }

  const value = Number.parseFloat(input);
  if (Number.isNaN(value) || value <= 0) {
    return { ok: false, error: 'invalid' };
  }

  return { ok: true, value };
}

export function calculatePurchase(
  stockCount: number,
  stockPrice: number,
  vehiclePrice: number
): { totalValue: number; numberOfCars: number } {
  const totalValue = stockCount * stockPrice;
  return { totalValue, numberOfCars: totalValue / vehiclePrice };
}

export function buildHistorySeries(
  timestamps: number[],
  closes: (number | null)[],
  stockCount: number,
  vehiclePrice: number,
  formatLabel: (d: Date) => string
): { labels: string[]; values: number[] } {
  const paired = timestamps
    .map((ts, i) => ({ ts, close: closes[i] }))
    .filter((d): d is { ts: number; close: number } => d.close != null);

  return {
    labels: paired.map(({ ts }) => formatLabel(new Date(ts * 1000))),
    values: paired.map(({ close }) => (stockCount * close) / vehiclePrice),
  };
}

export function shortfallToNextCar(
  stockCount: number,
  stockPrice: number,
  vehiclePrice: number
): { targetCars: number; neededValue: number; neededShares: number } {
  const totalValue = stockCount * stockPrice;
  const targetCars = Math.floor(totalValue / vehiclePrice) + 1;
  const neededValue = targetCars * vehiclePrice - totalValue;
  return { targetCars, neededValue, neededShares: neededValue / stockPrice };
}

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

export type ChartPeriod = '1M' | '6M' | '1Y' | '5Y';

// 라벨 종류만 정의하고 실제 형식은 locale에 따라 Intl로 만든다
const PERIOD_CONFIGS: Record<
  ChartPeriod,
  { range: string; interval: string; labelKind: 'day' | 'month' | 'yearMonth' }
> = {
  '1M': { range: '1mo', interval: '1d', labelKind: 'day' },
  '6M': { range: '6mo', interval: '1wk', labelKind: 'month' },
  '1Y': { range: '1y', interval: '1mo', labelKind: 'month' },
  '5Y': { range: '5y', interval: '3mo', labelKind: 'yearMonth' },
};

function makeLabelFormatter(
  kind: 'day' | 'month' | 'yearMonth',
  locale: string
): (d: Date) => string {
  if (kind === 'yearMonth') {
    // 축 라벨 공간이 좁아 locale 무관 숫자 표기(예: 24.8) 사용
    return (d) => `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}`;
  }
  const fmt = new Intl.DateTimeFormat(
    locale,
    kind === 'day' ? { day: 'numeric' } : { month: 'short' }
  );
  return (d) => fmt.format(d);
}

export function getPeriodConfig(period: ChartPeriod, locale: string) {
  const { range, interval, labelKind } = PERIOD_CONFIGS[period];
  return { range, interval, formatLabel: makeLabelFormatter(labelKind, locale) };
}

export function decimateLabels(labels: string[], maxCount: number): string[] {
  if (labels.length <= maxCount) return labels;
  const step = Math.ceil(labels.length / maxCount);
  return labels.map((label, i) => (i % step === 0 ? label : ''));
}

export function formatCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
