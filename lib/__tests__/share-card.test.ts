import { silhouetteFor } from '../share-card';

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
