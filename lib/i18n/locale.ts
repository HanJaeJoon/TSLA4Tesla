import { SUPPORTED_LOCALES, SupportedLocale } from './translations';

// 기기 언어 목록(우선순위 순)에서 첫 번째 지원 언어를 고른다. 없으면 en.
export function pickSupportedLocale(
  languageCodes: (string | null | undefined)[]
): SupportedLocale {
  for (const code of languageCodes) {
    if (code && (SUPPORTED_LOCALES as readonly string[]).includes(code)) {
      return code as SupportedLocale;
    }
  }
  return 'en';
}
