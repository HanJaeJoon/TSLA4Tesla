import { buildHistorySeries, getPeriodConfig, ChartPeriod } from './calculator';

export type SnapshotHistory = {
  timestamps: number[];
  closes: (number | null)[];
};

export type MarketSnapshot = {
  updatedAt: string;
  price: number;
  // USD -> 각 통화 환율. 릴리스 시점에 scripts/update-market-snapshot.js가 채운다.
  usdRates: Record<string, number>;
  history: Partial<Record<ChartPeriod, SnapshotHistory>>;
};

export function getSnapshotRate(
  snapshot: MarketSnapshot,
  currency: string
): number | null {
  return snapshot.usdRates?.[currency] ?? null;
}

export function getSnapshotSeries(
  snapshot: MarketSnapshot,
  period: ChartPeriod,
  stockCount: number,
  vehiclePrice: number,
  locale: string
): { labels: string[]; values: number[] } | null {
  const history = snapshot.history[period];
  if (!history || history.timestamps.length === 0) return null;

  const { formatLabel } = getPeriodConfig(period, locale);
  const series = buildHistorySeries(
    history.timestamps,
    history.closes,
    stockCount,
    vehiclePrice,
    formatLabel
  );
  return series.values.length > 0 ? series : null;
}
