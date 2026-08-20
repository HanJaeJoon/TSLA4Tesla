export type SilhouetteKind = 'sedan' | 'suv' | 'pickup';

// 공유/저장 시 사용자에게 보이는 파일명. 저장을 여러 번 해도 겹치지 않게 초 단위 타임스탬프를 붙인다.
export function shareFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `TSLA4Tesla-${date}-${time}.png`;
}

// 공유 카드에 그릴 자체 제작 차량 실루엣 종류 (Tesla 에셋 미사용)
export function silhouetteFor(vehicle: string): SilhouetteKind {
  if (vehicle === 'Cybertruck') return 'pickup';
  if (vehicle === 'Model Y' || vehicle === 'Model X') return 'suv';
  return 'sedan';
}
