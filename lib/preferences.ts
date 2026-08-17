import AsyncStorage from '@react-native-async-storage/async-storage';

const INPUTS_KEY = 'tsla4tesla:inputs';

export type SavedInputs = {
  stockCount: string;
  vehicle: string;
  trimPrice: number;
};

export async function saveInputs(inputs: SavedInputs): Promise<void> {
  try {
    await AsyncStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
  } catch {
    // 저장 실패는 치명적이지 않으므로 무시
  }
}

export async function loadInputs(): Promise<SavedInputs | null> {
  try {
    const raw = await AsyncStorage.getItem(INPUTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.stockCount !== 'string' ||
      typeof parsed?.vehicle !== 'string' ||
      typeof parsed?.trimPrice !== 'number'
    ) {
      return null;
    }
    return parsed as SavedInputs;
  } catch {
    return null;
  }
}
