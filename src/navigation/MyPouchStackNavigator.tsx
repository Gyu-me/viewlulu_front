/**
 * MyPouchStackNavigator (FINAL - CaptureStack 분리 기준)
 * --------------------------------------------------
 * ✅ MyPouch 관련 화면만 유지
 * ❌ 촬영/등록/인식 플로우 전부 제거
 * ✅ DetectResult / Detail 에서 탭바 숨김
 */

import React from 'react';
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
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}
