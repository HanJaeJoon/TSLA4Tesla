import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPrefs } from '../prefs';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

type Sample = { name: string; count: number };

const isSample = (v: unknown): v is Sample =>
  typeof (v as Sample)?.name === 'string' && typeof (v as Sample)?.count === 'number';

const prefs = createPrefs<Sample>('test:sample', isSample);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('createPrefs', () => {
  it('저장한 값을 그대로 복원한다', async () => {
    await prefs.save({ name: 'a', count: 1 });
    expect(await prefs.load()).toEqual({ name: 'a', count: 1 });
  });

  it('저장된 값이 없으면 null을 반환한다', async () => {
    expect(await prefs.load()).toBeNull();
  });

  it('검증에 실패하는 값이 저장돼 있으면 null을 반환한다', async () => {
    await AsyncStorage.setItem('test:sample', JSON.stringify({ name: 'a' }));
    expect(await prefs.load()).toBeNull();
  });

  it('JSON이 깨져 있어도 예외를 던지지 않고 null을 반환한다', async () => {
    await AsyncStorage.setItem('test:sample', '{{{');
    expect(await prefs.load()).toBeNull();
  });

  it('키가 다르면 서로 간섭하지 않는다', async () => {
    const other = createPrefs<Sample>('test:other', isSample);
    await prefs.save({ name: 'a', count: 1 });
    expect(await other.load()).toBeNull();
  });
});
