import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveInputs, loadInputs } from '../preferences';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('preferences', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('저장한 입력값을 다시 불러올 수 있다', async () => {
    await saveInputs({ stockCount: '100', vehicle: 'Model Y', trimPrice: 46630 });
    const loaded = await loadInputs();
    expect(loaded).toEqual({ stockCount: '100', vehicle: 'Model Y', trimPrice: 46630 });
  });

  it('저장된 값이 없으면 null을 반환한다', async () => {
    const loaded = await loadInputs();
    expect(loaded).toBeNull();
  });

  it('저장된 값이 손상됐으면 null을 반환한다', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('not-json{');
    const loaded = await loadInputs();
    expect(loaded).toBeNull();
  });

  it('필드 타입이 다르면 null을 반환한다', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ stockCount: 100, vehicle: 'Model 3', trimPrice: 38630 })
    );
    expect(await loadInputs()).toBeNull();
  });

  it('필드가 빠져 있으면 null을 반환한다', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ vehicle: 'Model 3', trimPrice: 38630 })
    );
    expect(await loadInputs()).toBeNull();
  });
});
