module.exports = {
  // 기본 포맷팅 옵션
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',

  // JSX 전용 옵션
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // React Native 최적화
  bracketSameLine: false,
  endOfLine: 'lf',

  // NativeWind className 지원
  singleAttributePerLine: false,

  // 파일별 설정
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
  ],
};
