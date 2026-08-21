import { I18n } from 'i18n-js';
import { translations, SUPPORTED_LOCALES, SupportedLocale } from '../i18n/translations';

// 중첩 객체의 키를 "a.b" 형태로 평탄화
const flattenKeys = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flattenKeys(value as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

describe('translations', () => {
  it('지원 locale 목록과 번역 리소스의 locale이 일치한다', () => {
    expect(Object.keys(translations).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it.each(Object.keys(translations) as SupportedLocale[])(
    '%s locale은 en과 동일한 키 집합을 가진다',
    (locale) => {
      const enKeys = flattenKeys(translations.en).sort();
      expect(flattenKeys(translations[locale]).sort()).toEqual(enKeys);
    }
  );

  it('모든 번역 값은 문자열이다 (빈 문자열 허용)', () => {
    for (const locale of Object.keys(translations) as SupportedLocale[]) {
      const check = (obj: Record<string, unknown>) => {
        for (const value of Object.values(obj)) {
          if (value !== null && typeof value === 'object') {
            check(value as Record<string, unknown>);
          } else {
            expect(typeof value).toBe('string');
          }
        }
      };
      check(translations[locale]);
    }
  });
});

// count가 1일 때 단수형이 나와야 하는 키들 (i18n-js 복수형 규칙 사용)
const PLURAL_KEYS = ['nextTargetLabel', 'shareHeadline'] as const;

describe('복수형 처리', () => {
  it.each(Object.keys(translations) as SupportedLocale[])(
    '%s locale의 복수형 키는 one/other를 모두 가진다',
    (locale) => {
      for (const key of PLURAL_KEYS) {
        expect(Object.keys(translations[locale][key]).sort()).toEqual(['one', 'other']);
      }
    }
  );

  const makeI18n = (locale: SupportedLocale) => {
    const i18n = new I18n(translations);
    i18n.locale = locale;
    i18n.enableFallback = true;
    i18n.defaultLocale = 'en';
    return i18n;
  };

  it('en은 1일 때 단수형, 그 외에는 복수형을 쓴다', () => {
    const i18n = makeI18n('en');
    expect(i18n.t('nextTargetLabel', { count: 1 })).toBe('Next goal: 1 car');
    expect(i18n.t('nextTargetLabel', { count: 2 })).toBe('Next goal: 2 cars');
    expect(i18n.t('shareHeadline', { count: 1 })).toBe('My 1 TSLA share =');
    expect(i18n.t('shareHeadline', { count: 3 })).toBe('My 3 TSLA shares =');
  });

  it('de/es의 shareHeadline 단수형은 숫자 1 없이 관사형으로 표기한다', () => {
    expect(makeI18n('de').t('shareHeadline', { count: 1 })).toBe('Meine TSLA-Aktie =');
    expect(makeI18n('es').t('shareHeadline', { count: 1 })).toBe('Mi acción de TSLA =');
    // 복수형은 그대로 숫자를 표기한다
    expect(makeI18n('de').t('shareHeadline', { count: 3 })).toBe('Meine 3 TSLA-Aktien =');
    expect(makeI18n('es').t('shareHeadline', { count: 3 })).toBe('Mis 3 acciones de TSLA =');
  });

  it.each(Object.keys(translations) as SupportedLocale[])(
    '%s locale은 개수와 무관하게 누락 표시 없이 렌더링된다',
    (locale) => {
      const i18n = makeI18n(locale);
      for (const key of PLURAL_KEYS) {
        for (const count of [0, 1, 2, 1.5]) {
          const text = i18n.t(key, { count });
          // 관사형 단수 문구(de/es shareHeadline)는 의도적으로 숫자를 표기하지 않는다
          const form = count === 1 ? 'one' : 'other';
          if (translations[locale][key][form].includes('{{count}}')) {
            expect(text).toContain(String(count));
          }
          expect(text).not.toMatch(/missing/i);
        }
      }
    }
  );
});
