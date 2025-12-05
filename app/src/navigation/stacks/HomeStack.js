import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '@features/home/screens/HomeScreen';

const Stack = createStackNavigator();

// HomeNavigator는 홈 화면만 포함
// 나머지 스크린들은 MainNavigator에서 직접 관리
const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false}}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
