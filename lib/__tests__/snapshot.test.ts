import { getSnapshotSeries, MarketSnapshot } from '../snapshot';

const JAN = Date.UTC(2026, 0, 15, 12) / 1000;
const FEB = Date.UTC(2026, 1, 15, 12) / 1000;

const snapshot: MarketSnapshot = {
  updatedAt: '2026-08-17',
  price: 342.27,
  usdKrw: 1390,
  history: {
    '1Y': { timestamps: [JAN, FEB], closes: [400, 500] },
  },
};

describe('getSnapshotSeries', () => {
  it('스냅샷에서 기간별 시리즈를 만든다 (기간 라벨 형식 적용)', () => {
    const series = getSnapshotSeries(snapshot, '1Y', 100, 40000);
    expect(series).toEqual({ labels: ['1월', '2월'], values: [1, 1.25] });
  });

  it('스냅샷에 없는 기간이면 null을 반환한다', () => {
    expect(getSnapshotSeries(snapshot, '5Y', 100, 40000)).toBeNull();
  });

  it('데이터가 비어 있으면 null을 반환한다', () => {
    const empty: MarketSnapshot = {
      ...snapshot,
      history: { '1Y': { timestamps: [], closes: [] } },
    };
    expect(getSnapshotSeries(empty, '1Y', 100, 40000)).toBeNull();
  });
});
