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
