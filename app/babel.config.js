module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    // NativeWind v4 babel preset
    'nativewind/babel',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.js', '.jsx', '.json'],
        alias: {
          '@assets': './assets',
          '@shared': './src/shared',
          '@features': './src/features',
          '@styles': './src/styles',
          '@utils': './src/utils',
          '@store': './src/store',
          '@services': './src/services',
          '@navigation': './src/navigation',
          '@providers': './src/providers',
          '@gql': './src/gql',
          '@graphql': './src/graphql',
          '@config': './src/config',
        },
      },
    ],
    // React Compiler (Reanimated 전에 추가)
    'babel-plugin-react-compiler',
    // Reanimated 플러그인은 반드시 마지막에 추가
    'react-native-reanimated/plugin',
  ],
};
