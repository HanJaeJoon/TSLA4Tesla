import { getSnapshotSeries, getSnapshotRate, MarketSnapshot } from '../snapshot';

const JAN = Date.UTC(2026, 0, 15, 12) / 1000;
const FEB = Date.UTC(2026, 1, 15, 12) / 1000;

const snapshot: MarketSnapshot = {
  updatedAt: '2026-08-17',
  price: 342.27,
  usdRates: { KRW: 1390, JPY: 147.2 },
  history: {
    '1Y': { timestamps: [JAN, FEB], closes: [400, 500] },
  },
};

describe('getSnapshotRate', () => {
  it('스냅샷에 있는 통화의 환율을 반환한다', () => {
    expect(getSnapshotRate(snapshot, 'KRW')).toBe(1390);
    expect(getSnapshotRate(snapshot, 'JPY')).toBe(147.2);
  });

  it('스냅샷에 없는 통화면 null을 반환한다', () => {
    expect(getSnapshotRate(snapshot, 'MXN')).toBeNull();
  });

  it('usdRates가 없는 스냅샷이면 null을 반환한다', () => {
    const noRates = { ...snapshot, usdRates: undefined } as unknown as MarketSnapshot;
    expect(getSnapshotRate(noRates, 'KRW')).toBeNull();
  });
});

describe('getSnapshotSeries', () => {
  it('스냅샷에서 기간별 시리즈를 만든다 (locale별 기간 라벨 형식 적용)', () => {
    const series = getSnapshotSeries(snapshot, '1Y', 100, 40000, 'ko');
    expect(series).toEqual({ labels: ['1월', '2월'], values: [1, 1.25] });

    const enSeries = getSnapshotSeries(snapshot, '1Y', 100, 40000, 'en');
    expect(enSeries?.labels).toEqual(['Jan', 'Feb']);
  });

  it('스냅샷에 없는 기간이면 null을 반환한다', () => {
    expect(getSnapshotSeries(snapshot, '5Y', 100, 40000, 'ko')).toBeNull();
  });

  it('데이터가 비어 있으면 null을 반환한다', () => {
    const empty: MarketSnapshot = {
      ...snapshot,
      history: { '1Y': { timestamps: [], closes: [] } },
    };
    expect(getSnapshotSeries(empty, '1Y', 100, 40000, 'ko')).toBeNull();
  });
});
