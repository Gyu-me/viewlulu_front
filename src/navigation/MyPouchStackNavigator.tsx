/**
 * MyPouchStackNavigator (최종 기준본)
 * --------------------------------------------------
 * ✅ 화장품 인식 플로우 완결
 * ✅ Stack 내부 이동만 허용
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MyPouchScreen from '../screens/MyPouchScreen';
import CosmeticDetectScreen from '../screens/CosmeticDetectScreen';
import CosmeticDetectResultScreen from '../screens/CosmeticDetectResultScreen';
import CosmeticDetailScreen from '../screens/CosmeticDetailScreen';
import CosmeticRegisterScreen from '../screens/CosmeticRegisterScreen';
import CosmeticConfirmScreen from '../screens/CosmeticConfirmScreen';


export type MyPouchStackParamList = {
  MyPouch: undefined;
  CosmeticDetect: undefined;
  CosmeticDetectResult: {
    cosmeticId: string | null;
    score?: number | null;
  };
  CosmeticDetail: {
    cosmeticId: string;
  };
};

const Stack = createNativeStackNavigator<MyPouchStackParamList>();

export default function MyPouchStackNavigator() {
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
        name="CosmeticDetect"
        component={CosmeticDetectScreen}
        options={{ title: '화장품 인식' }}
      />

      <Stack.Screen
        name="CosmeticDetectResult"
        component={CosmeticDetectResultScreen}
        options={{ title: '인식 결과' }}
      />

      <Stack.Screen
        name="CosmeticDetail"
        component={CosmeticDetailScreen}
        options={{ title: '화장품 정보' }}
      />

      <Stack.Screen
        name="CosmeticRegister"
        component={CosmeticRegisterScreen}
        options={{ title: '화장품 등록' }}
      />

      <Stack.Screen
        name="CosmeticConfirm"
        component={CosmeticConfirmScreen}
        options={{ title: '화장품 확인' }}
      />

    </Stack.Navigator>
  );
}
