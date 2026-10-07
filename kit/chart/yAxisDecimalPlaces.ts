// Y축 라벨의 소수 자릿수를 값 범위에 맞춰 정한다.
// react-native-chart-kit은 min~max를 segments 등분해 라벨을 만들므로, 값 범위가 작으면
// 고정 자릿수(예: 1자리)로는 라벨이 전부 같은 값(0.0 등)으로 뭉개진다.
// 인접 라벨의 간격(step)이 표기에서 구별되는 최소 자릿수를 돌려준다.

const MAX_DECIMAL_PLACES = 4;
// 부동소수점 오차로 경계값(0.1 등)의 log10이 살짝 넘치는 것을 흡수
const EPSILON = 1e-9;

export function yAxisDecimalPlaces(values: number[], segments = 4): number {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return 1;

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const step = (max - min) / segments;
  // 값이 전부 같으면 라벨이 1개뿐이므로 값 자체가 0으로 뭉개지지 않을 자릿수를 고른다
  const target = step > 0 ? step : Math.abs(max);
  if (target === 0) return 1;

  const digits = Math.ceil(-Math.log10(target) - EPSILON);
  // 기존 표기(소수 1자리)를 하한으로 유지하고, 라벨 폭이 넘치지 않게 상한을 둔다
  const clamp = (d: number) => Math.min(MAX_DECIMAL_PLACES, Math.max(1, d));
  const base = clamp(digits);
  if (step === 0 || labelsEvenlySpaced(min, step, segments, base)) return base;
  // step 이 그 자릿수로 딱 떨어지지 않으면 반올림 때문에 라벨 간격이 들쭉날쭉해진다
  // (예: 1.6, 1.7, 1.9, 2.1). 한 자리 더 늘려 반올림 오차를 step 의 1/10 이하로 줄인다.
  return clamp(digits + 1);
}

// chart-kit 과 같은 방식(min + step * i 를 toFixed)으로 만든 라벨의 간격이 모두 같은지
function labelsEvenlySpaced(min: number, step: number, segments: number, digits: number): boolean {
  const scale = 10 ** digits;
  const units = Array.from({ length: segments + 1 }, (_, i) =>
    Math.round(Number((min + step * i).toFixed(digits)) * scale)
  );
  return units.every((u, i) => i === 0 || u - units[i - 1] === units[1] - units[0]);
}
