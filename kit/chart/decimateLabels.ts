// 라벨이 너무 많으면 겹쳐 보이므로 일정 간격만 남기고 빈 문자열로 만든다.
export function decimateLabels(labels: string[], maxCount: number): string[] {
  if (labels.length <= maxCount) return labels;
  const step = Math.ceil(labels.length / maxCount);
  return labels.map((label, i) => (i % step === 0 ? label : ''));
}
