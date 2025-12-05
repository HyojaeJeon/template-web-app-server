import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@providers/ThemeProvider';

const LoadingScreen = () => {
  const { colors: theme } = useTheme();

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgPrimary }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};

export default LoadingScreen;
