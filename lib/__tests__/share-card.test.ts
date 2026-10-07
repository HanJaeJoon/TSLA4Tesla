import { shareFileName, silhouetteFor } from '../share-card';

describe('silhouetteFor', () => {
  it('모델마다 전용 실루엣을 사용한다', () => {
    expect(silhouetteFor('Model 3')).toBe('model3');
    expect(silhouetteFor('Model Y')).toBe('modelY');
    expect(silhouetteFor('Model S')).toBe('modelS');
    expect(silhouetteFor('Model X')).toBe('modelX');
    expect(silhouetteFor('Cybertruck')).toBe('cybertruck');
  });

  it('모르는 모델은 Model 3 실루엣으로 대신한다', () => {
    expect(silhouetteFor('Roadster')).toBe('model3');
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
