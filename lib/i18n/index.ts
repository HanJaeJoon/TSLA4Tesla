import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { translations } from './translations';
import { pickSupportedLocale } from './locale';

const deviceLocales = getLocales();

// 앱 표시 언어 (지원 언어가 없으면 en)
export const appLocale = pickSupportedLocale(deviceLocales.map((l) => l.languageCode));

// 기기 지역의 통화 코드 (환산 표시 대상 결정에 사용)
export const deviceCurrencyCode = deviceLocales[0]?.currencyCode ?? null;

const i18n = new I18n(translations);
i18n.locale = appLocale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const t = i18n.t.bind(i18n);
