module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended', 
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'prettier'
  ],
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'import'
  ],
  rules: {
    // React 규칙
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/jsx-key': 'error',
    'react/no-array-index-key': 'warn',
    'react/no-unused-state': 'warn',
    'react/prefer-stateless-function': 'warn',
    'react/self-closing-comp': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // 일반 JavaScript 규칙
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    'no-console': ['warn', { 'allow': ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // JSDoc 규칙 완화 (임시)
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-implicit-coercion': 'error',
    'no-magic-numbers': ['warn', { 
      'ignore': [-1, 0, 1, 2],
      'ignoreArrayIndexes': true 
    }],
    
    // Import 규칙
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external', 
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],
    'import/no-duplicates': 'error',
    'import/no-unused-modules': 'warn',
    'import/no-cycle': 'off', // 임시로 비활성화
    'import/named': 'off', // Apollo Client import 오류 방지
    
    // WCAG 2.1 접근성 규칙 강화
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/lang': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/no-distracting-elements': 'error',
    'jsx-a11y/media-has-caption': 'warn',
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    
    // Application-specific rules
    'no-restricted-imports': ['error', {
      'patterns': [{
        'group': ['../../../*'],
        'message': 'Deep relative imports are not allowed. Use ./src/shared, @features, or @utils instead.'
      }]
    }],
    'no-restricted-syntax': [
      'error',
      {
        'selector': 'Literal[value=/hardcoded.*text/]',
        'message': 'Hardcoded text should use i18n.'
      },
      {
        'selector': 'Literal[value=/VND|₫/]',
        'message': 'Currency display should use formatVND() utility.'
      },
      {
        'selector': 'TemplateLiteral[quasis.0.value.raw=/.*(color).*#[0-9a-fA-F]{3,6}.*/]',
        'message': 'Color values should use design tokens from tailwind.config.js.'
      }
    ]
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src']
      },
      alias: {
        map: [
          ['@', './src'],
          ['./src/shared', './src/shared'],
          ['@features', './src/features'],
          ['@styles', './src/styles'],
          ['@utils', './src/utils'],
          ['@store', './src/store'],
          ['@lib', './src/lib']
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      env: {
        jest: true
      },
      rules: {
        'no-magic-numbers': 'off'
      }
    },
    {
      files: ['src/shared/components/vietnam/**/*.{js,jsx}'],
      rules: {
        'no-restricted-syntax': 'off'
      }
    }
  ]
};