export type SilhouetteKind = 'model3' | 'modelY' | 'modelS' | 'modelX' | 'cybertruck';

// 공유/저장 시 사용자에게 보이는 파일명. 저장을 여러 번 해도 겹치지 않게 초 단위 타임스탬프를 붙인다.
export function shareFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `TSLA4Tesla-${date}-${time}.png`;
}

// 공유 카드에 그릴 자체 제작 차량 실루엣 (Tesla 에셋 미사용). 모르는 모델은 Model 3 로 그린다.
const SILHOUETTE_BY_VEHICLE: Record<string, SilhouetteKind> = {
  'Model 3': 'model3',
  'Model Y': 'modelY',
  'Model S': 'modelS',
  'Model X': 'modelX',
  Cybertruck: 'cybertruck',
};

export function silhouetteFor(vehicle: string): SilhouetteKind {
  return SILHOUETTE_BY_VEHICLE[vehicle] ?? 'model3';
}
