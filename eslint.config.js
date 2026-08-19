// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*'],
  },
  {
    // kit은 앱을 모른다. 이 단방향 의존이 깨지면 kit을 별도 패키지로 승격할 수 없다.
    files: ['kit/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/app/*',
                '**/lib/*',
                '**/components/*',
                '../app/*',
                '../lib/*',
                '../components/*',
              ],
              message: 'kit은 앱 코드를 import할 수 없습니다. 필요한 값은 인자나 prop으로 받으세요.',
            },
          ],
        },
      ],
    },
  },
  {
    // 빌드/도구 스크립트는 Node 환경에서 실행된다 (RN 런타임 아님)
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
]);
