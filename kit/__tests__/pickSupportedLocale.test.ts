import { pickSupportedLocale } from '../i18n/pickSupportedLocale';

const SUPPORTED = ['en', 'ko', 'ja'] as const;

describe('pickSupportedLocale', () => {
  it('첫 번째 지원 언어를 고른다', () => {
    expect(pickSupportedLocale(['ko', 'en'], SUPPORTED, 'en')).toBe('ko');
  });

  it('미지원 언어는 건너뛴다', () => {
    expect(pickSupportedLocale(['fr', 'ja'], SUPPORTED, 'en')).toBe('ja');
  });

  it('지원 언어가 하나도 없으면 fallback을 쓴다', () => {
    expect(pickSupportedLocale(['fr', 'it'], SUPPORTED, 'en')).toBe('en');
  });

  it('null과 undefined를 건너뛴다', () => {
    expect(pickSupportedLocale([null, undefined, 'ko'], SUPPORTED, 'en')).toBe('ko');
  });

  it('목록이 비어 있으면 fallback을 쓴다', () => {
    expect(pickSupportedLocale([], SUPPORTED, 'en')).toBe('en');
  });
});
