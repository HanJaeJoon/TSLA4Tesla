export type SilhouetteKind = 'sedan' | 'suv' | 'pickup';

// 공유 카드에 그릴 자체 제작 차량 실루엣 종류 (Tesla 에셋 미사용)
export function silhouetteFor(vehicle: string): SilhouetteKind {
  if (vehicle === 'Cybertruck') return 'pickup';
  if (vehicle === 'Model Y' || vehicle === 'Model X') return 'suv';
  return 'sedan';
}
