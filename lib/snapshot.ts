import { buildHistorySeries, getPeriodConfig, ChartPeriod } from './calculator';

export type SnapshotHistory = {
  timestamps: number[];
  closes: (number | null)[];
};

export type MarketSnapshot = {
  updatedAt: string;
  price: number;
  usdKrw: number | null;
  history: Partial<Record<ChartPeriod, SnapshotHistory>>;
};

export function getSnapshotSeries(
  snapshot: MarketSnapshot,
  period: ChartPeriod,
  stockCount: number,
  vehiclePrice: number
): { labels: string[]; values: number[] } | null {
  const history = snapshot.history[period];
  if (!history || history.timestamps.length === 0) return null;

  const { formatLabel } = getPeriodConfig(period);
  const series = buildHistorySeries(
    history.timestamps,
    history.closes,
    stockCount,
    vehiclePrice,
    formatLabel
  );
  return series.values.length > 0 ? series : null;
}
