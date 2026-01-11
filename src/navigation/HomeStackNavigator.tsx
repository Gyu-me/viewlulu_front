/**
 * HomeStackNavigator (정리된 1단계)
 * --------------------------------------------------
 * 역할:
 * - "진짜 홈(HomeScreen)"만 담당
 *
 * 설계 의도:
 * - 얼굴형 분석, 피부 분석, 결과 화면 등
 *   '기능 실행 화면'은 절대 Home으로 취급하지 않음
 * - Home 탭을 누르면 항상 HomeScreen으로 복귀되도록 보장
 *
 * 접근성:
 * - 사용자는 "홈으로 돌아왔다"는 상태를
 *   항상 예측 가능하게 인식 가능
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        headerBackTitleVisible: false,
      }}
    >
      {/* 🏠 진짜 홈 (유일한 Home) */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}
