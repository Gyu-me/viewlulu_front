/**
 * CaptureStackNavigator (촬영 전용 스택)
 * --------------------------------------------------
 * ✅ 하단 탭바 없음
 * ✅ 촬영 플로우 단일 책임
 * ✅ Root에서만 진입/이탈
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CosmeticDetectScreen from '../screens/CosmeticDetectScreen';
import CosmeticDetectResultScreen from '../screens/CosmeticDetectResultScreen';
import CosmeticRegisterScreen from '../screens/CosmeticRegisterScreen';
import CosmeticConfirmScreen from '../screens/CosmeticConfirmScreen';


export type CaptureStackParamList = {
  CosmeticDetect: undefined;
  CosmeticRegister: { reset?: boolean } | undefined;
  CosmeticConfirm: { photos: string[] };
  CosmeticDetectResult: {
    cosmeticId: string;
  };
};


const Stack = createNativeStackNavigator<CaptureStackParamList>();

export default function CaptureStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CosmeticDetect"
        component={CosmeticDetectScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CosmeticDetectResult"
        component={CosmeticDetectResultScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CosmeticRegister"
        component={CosmeticRegisterScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="CosmeticConfirm"
        component={CosmeticConfirmScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
