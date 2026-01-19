/**
 * MyPouchStackNavigator (최종 기준본)
 * --------------------------------------------------
 * [역할]
 * - "나의 파우치" 탭 전용 Stack
 * - 화장품 인식 플로우를 이 Stack 내부에서 완결
 *
 * [포함 흐름]
 * - MyPouch (목록)
 * - CosmeticDetect (인식 카메라)
 * - CosmeticDetectResult (인식 결과)
 * - CosmeticDetail (상세 정보)
 *
 * ⚠️ 중요 원칙
 * - Root / Home 경유 ❌
 * - 같은 Stack 내부 이동만 허용
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MyPouchScreen from '../screens/MyPouchScreen';
import CosmeticDetectScreen from '../screens/CosmeticDetectScreen';
import CosmeticDetectResultScreen from '../screens/CosmeticDetectResultScreen';
import CosmeticDetailScreen from '../screens/CosmeticDetailScreen';

/* ================= 타입 정의 =========
======== */

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

/* ================= Navigator ================= */

export default function MyPouchStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
          animation: 'slide_from_right',
          headerBackTitleVisible: false,

          contentStyle: {
            backgroundColor: '#0A0A0A',
          },
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
        options={{ title: '화장품 정보' }}
      />
    </Stack.Navigator>
  );
}
