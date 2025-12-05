module.exports = {
  // 기본 포맷팅
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // 들여쓰기 및 줄바꿈
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  endOfLine: 'lf',
  
  // JSX 관련
  jsxSingleQuote: true,
  
  // 파일별 설정
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        printWidth: 200,
        tabWidth: 2,
      }
    },
    {
      files: ['*.md'],
      options: {
        printWidth: 100,
        proseWrap: 'always'
      }
    }
  ]
};