import { shareFileName, silhouetteFor } from '../share-card';

describe('silhouetteFor', () => {
  it('Cybertruck은 픽업 실루엣을 사용한다', () => {
    expect(silhouetteFor('Cybertruck')).toBe('pickup');
  });

  it('Model Y/X는 SUV 실루엣을 사용한다', () => {
    expect(silhouetteFor('Model Y')).toBe('suv');
    expect(silhouetteFor('Model X')).toBe('suv');
  });

  it('그 외 모델은 세단 실루엣을 사용한다', () => {
    expect(silhouetteFor('Model 3')).toBe('sedan');
    expect(silhouetteFor('Model S')).toBe('sedan');
  });
});

describe('shareFileName', () => {
  it('앱 이름과 초 단위 타임스탬프로 파일명을 만든다', () => {
    expect(shareFileName(new Date(2026, 7, 20, 21, 59, 3))).toBe(
      'TSLA4Tesla-20260820-215903.png'
    );
  });

  it('한 자리 월/일/시각은 0으로 채운다', () => {
    expect(shareFileName(new Date(2026, 0, 5, 9, 4, 7))).toBe('TSLA4Tesla-20260105-090407.png');
  });
});
