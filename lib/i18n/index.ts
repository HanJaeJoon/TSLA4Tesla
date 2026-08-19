import { createI18n } from '../../kit/i18n';
import { translations, SUPPORTED_LOCALES } from './translations';

export const { t, appLocale, deviceCurrencyCode } = createI18n({
  translations,
  supportedLocales: SUPPORTED_LOCALES,
  fallbackLocale: 'en',
});
