import { createPrefs } from '../kit/prefs';

export type SavedInputs = {
  stockCount: string;
  vehicle: string;
  trimPrice: number;
};

function isSavedInputs(value: unknown): value is SavedInputs {
  const v = value as SavedInputs;
  return (
    typeof v?.stockCount === 'string' &&
    typeof v?.vehicle === 'string' &&
    typeof v?.trimPrice === 'number'
  );
}

const inputsPrefs = createPrefs<SavedInputs>('tsla4tesla:inputs', isSavedInputs);

export const saveInputs = inputsPrefs.save;
export const loadInputs = inputsPrefs.load;
