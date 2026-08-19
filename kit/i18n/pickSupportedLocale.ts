// 기기 언어 목록(우선순위 순)에서 첫 번째 지원 언어를 고른다. 없으면 fallback.
export function pickSupportedLocale<L extends string>(
  languageCodes: (string | null | undefined)[],
  supportedLocales: readonly L[],
  fallback: L
): L {
  for (const code of languageCodes) {
    if (code && (supportedLocales as readonly string[]).includes(code)) {
      return code as L;
    }
  }
  return fallback;
}
