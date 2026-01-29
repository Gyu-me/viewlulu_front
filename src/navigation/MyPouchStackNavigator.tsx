/**
 * MyPouchStackNavigator (FINAL - TabBar Central Control)
 * --------------------------------------------------
 * ✅ 탭바 제어는 여기서만
 * ✅ Detail / Edit → 탭바 숨김
 * ✅ MyPouch → 원본 탭바 강제 복구
 */

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import MyPouchScreen from '../screens/MyPouchScreen';
import CosmeticDetailScreen from '../screens/CosmeticDetailScreen';
import CosmeticEditScreen from '../screens/CosmeticEditScreen';

export type MyPouchStackParamList = {
  MyPouch: undefined;
  CosmeticDetail: {
    cosmeticId: string;
    fromDetect?: boolean;
  };
  CosmeticEdit: {
    cosmeticId: string;
  };
};

const Stack = createNativeStackNavigator<MyPouchStackParamList>();

export default function MyPouchStackNavigator({ navigation, route }: any) {
  // 🔥 여기 추가 (핵심)
  useEffect(() => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? 'MyPouch';

    if (routeName === 'CosmeticDetail' || routeName === 'CosmeticEdit') {
      // 👉 Detail / Edit 에서는 탭바 완전 숨김
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else {
      // 👉 MyPouch 에서는 항상 동일한 탭바 스타일 강제
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#000',
          borderTopColor: '#222',
        },
      });
    }
  }, [navigation, route]);

  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen
        name="MyPouch"
        component={MyPouchScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CosmeticDetail"
        component={CosmeticDetailScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CosmeticEdit"
        component={CosmeticEditScreen}
        options={{ headerShown: false, presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
