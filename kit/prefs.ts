import AsyncStorage from '@react-native-async-storage/async-storage';

// 저장 실패는 치명적이지 않으므로 삼킨다. 복원 실패도 null로 처리해 앱이 기본값으로 시작하게 한다. 삭제는 성공 여부를 돌려준다.
export function createPrefs<T>(
  storageKey: string,
  isValid: (value: unknown) => value is T
): { save(value: T): Promise<void>; load(): Promise<T | null>; remove(): Promise<boolean> } {
  return {
    async save(value: T): Promise<void> {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        // 무시
      }
    },
    async remove(): Promise<boolean> {
      try {
        await AsyncStorage.removeItem(storageKey);
        return true;
      } catch {
        return false;
      }
    },
    async load(): Promise<T | null> {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isValid(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
  };
}
