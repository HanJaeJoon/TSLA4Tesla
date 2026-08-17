import { translations, SUPPORTED_LOCALES, SupportedLocale } from '../i18n/translations';
import { pickSupportedLocale } from '../i18n/locale';

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

describe('pickSupportedLocale', () => {
  it('첫 번째 지원 언어를 선택한다', () => {
    expect(pickSupportedLocale(['ko'])).toBe('ko');
    expect(pickSupportedLocale(['ja', 'en'])).toBe('ja');
  });

  it('미지원 언어는 건너뛰고 다음 지원 언어를 선택한다', () => {
    expect(pickSupportedLocale(['fr', 'de'])).toBe('de');
  });

  it('지원 언어가 없으면 en으로 fallback한다', () => {
    expect(pickSupportedLocale(['fr', 'it'])).toBe('en');
    expect(pickSupportedLocale([])).toBe('en');
  });

  it('중국어 계열(zh)은 zh 리소스로 매핑한다', () => {
    expect(pickSupportedLocale(['zh'])).toBe('zh');
  });

  it('null/undefined 언어 코드는 무시한다', () => {
    expect(pickSupportedLocale([null, undefined, 'es'])).toBe('es');
  });
});
