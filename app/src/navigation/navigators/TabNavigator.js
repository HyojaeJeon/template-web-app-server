/**
 * TabNavigator - 하단 탭 네비게이터 (기본 뼈대)
 */

import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@providers/ThemeProvider';
import HomeNavigator from '@navigation/stacks/HomeStack';
import ProfileNavigator from '@navigation/stacks/ProfileStack';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { t, ready } = useTranslation(['common'], { useSuspense: false });
  const { colors: theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (ready) {
      setIsReady(true);
    }
  }, [ready]);

  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.bgPrimary }}>
        <View className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary }} />
      </SafeAreaView>
    );
  }

  const safeT = (key, defaultValue = key) => {
    try {
      return t(key) || defaultValue;
    } catch (error) {
      console.warn('Translation error:', error);
      return defaultValue;
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const iconSize = 22;
          let iconName;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: theme.tabBar?.active || theme.primary,
        tabBarInactiveTintColor: theme.tabBar?.inactive || theme.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 8,
          backgroundColor: theme.tabBar?.bg || theme.bgPrimary,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 25,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: theme.shadowOpacity || 0.1,
          shadowRadius: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden'
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2
        },
        tabBarIconStyle: {
          marginTop: 0
        }
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: safeT('navigation.home', 'Home')
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: safeT('navigation.profile', 'Profile')
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
