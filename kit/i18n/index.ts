import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { pickSupportedLocale } from './pickSupportedLocale';

export { pickSupportedLocale };

export function createI18n<L extends string>(config: {
  translations: Record<L, object>;
  supportedLocales: readonly L[];
  fallbackLocale: L;
}): {
  t: (key: string, options?: object) => string;
  appLocale: L;
  deviceCurrencyCode: string | null;
} {
  const deviceLocales = getLocales();

  const appLocale = pickSupportedLocale(
    deviceLocales.map((l) => l.languageCode),
    config.supportedLocales,
    config.fallbackLocale
  );

  const i18n = new I18n(config.translations);
  i18n.locale = appLocale;
  i18n.enableFallback = true;
  i18n.defaultLocale = config.fallbackLocale;

  return {
    t: i18n.t.bind(i18n),
    appLocale,
    // 기기 지역의 통화 코드 (환산 표시 대상 결정에 사용)
    deviceCurrencyCode: deviceLocales[0]?.currencyCode ?? null,
  };
}
