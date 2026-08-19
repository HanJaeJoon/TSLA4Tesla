import { useColorScheme } from 'react-native';

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  subtext: string;
  faint: string;
  border: string;
  buttonBg: string;
  chartGrid: string;
  bannerBg: string;
};

export const PALETTES: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    subtext: '#666666',
    faint: '#999999',
    border: '#dddddd',
    buttonBg: '#f0f0f0',
    chartGrid: '#f0f0f0',
    bannerBg: '#fbeaea',
  },
  dark: {
    background: '#121212',
    card: '#1e1e1e',
    text: '#f2f2f2',
    subtext: '#b3b3b3',
    faint: '#8a8a8a',
    border: '#3a3a3a',
    buttonBg: '#2a2a2a',
    chartGrid: '#2e2e2e',
    bannerBg: '#332222',
  },
};

// 앱은 브랜드 색에서 파생된 값만 override로 덮어쓴다.
export function useThemeColors(overrides?: {
  light?: Partial<ThemeColors>;
  dark?: Partial<ThemeColors>;
}): ThemeColors {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const base = isDark ? PALETTES.dark : PALETTES.light;
  const override = isDark ? overrides?.dark : overrides?.light;
  return override ? { ...base, ...override } : base;
}
