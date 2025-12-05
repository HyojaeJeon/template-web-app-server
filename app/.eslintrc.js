module.exports = {
  root: true,
  extends: [
    '@react-native',
    'prettier', // Prettier와 충돌하는 ESLint 규칙 비활성화
  ],
  plugins: ['prettier'],
  rules: {
    // Prettier 관련 규칙
    'prettier/prettier': ['error', {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      quoteProps: 'as-needed',
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'avoid',
      jsxSingleQuote: false,
      jsxBracketSameLine: false,
      bracketSameLine: false,
      endOfLine: 'lf',
    }],

    // React Native 특화 규칙
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'warn',
    'react-native/sort-styles': 'off', // NativeWind 사용으로 비활성화

    // React 관련 규칙
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/react-in-jsx-scope': 'off', // React 17+ 자동 import
    'react/prop-types': 'warn',
    'react/display-name': 'warn',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',

    // JavaScript 일반 규칙
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',

    // NativeWind className 관련 (Tailwind CSS)
    'react/no-unknown-property': ['error', { ignore: ['className'] }],

    // Import 관련 (절대 경로 사용 권장)
    'import/no-unresolved': 'off', // Babel module resolver 사용
    'import/prefer-default-export': 'off',

    // 성능 관련
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
  env: {
    'react-native/react-native': true,
    jest: true,
    es6: true,
    node: true,
  },
  globals: {
    __DEV__: 'readonly',
    FormData: 'readonly',
    fetch: 'readonly',
    navigator: 'readonly',
    requestAnimationFrame: 'readonly',
    cancelAnimationFrame: 'readonly',
  },
};
