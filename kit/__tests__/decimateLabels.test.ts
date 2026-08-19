import { decimateLabels } from '../chart/decimateLabels';

describe('decimateLabels', () => {
  it('최대 개수를 넘으면 일부만 남기고 빈 문자열로 바꾼다', () => {
    const labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
    const result = decimateLabels(labels, 6);
    expect(result).toHaveLength(12);
    expect(result).toEqual(['a', '', 'c', '', 'e', '', 'g', '', 'i', '', 'k', '']);
  });

  it('최대 개수 이하이면 그대로 반환한다', () => {
    expect(decimateLabels(['a', 'b', 'c'], 6)).toEqual(['a', 'b', 'c']);
  });
});
