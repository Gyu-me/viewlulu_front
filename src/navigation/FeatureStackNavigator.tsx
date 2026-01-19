/**
 * FeatureStackNavigator
 * --------------------------------------------------
 * "홈이 아닌" 기능 실행 전용 Stack
 *
 * 포함 기능:
 * - 얼굴형 분석 + 결과
 * - 피부 분석 + 결과
 * - 화장품 등록
 * - 최근 분석 결과
 *
 * 특징:
 * - BottomTab ❌
 * - 기능 실행 중에는 홈으로 인식되지 않음
 * - 접근성 관점에서 "작업 모드"가 명확
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CosmeticDetectScreen from '../screens/CosmeticDetectScreen';
import CosmeticDetectResultScreen from '../screens/CosmeticDetectResultScreen';
import FaceAnalysisScreen from '../screens/FaceAnalysisScreen';
import FaceResultScreen from '../screens/FaceResultScreen';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import SkinResultScreen from '../screens/SkinResultScreen';
import CosmeticRegisterScreen from '../screens/CosmeticRegisterScreen';
import RecentResultScreen from '../screens/RecentResultScreen';

const Stack = createNativeStackNavigator();

export default function FeatureStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'slide_from_right',
        headerBackTitleVisible: false,
      }}
    >
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
        name="FaceAnalysis"
        component={FaceAnalysisScreen}
        options={{ title: '얼굴형 분석' }}
      />

      <Stack.Screen
        name="FaceResult"
        component={FaceResultScreen}
        options={{ title: '얼굴형 분석 결과' }}
      />

      <Stack.Screen
        name="SkinAnalysis"
        component={SkinAnalysisScreen}
        options={{ title: '피부 분석' }}
      />

      <Stack.Screen
        name="SkinResult"
        component={SkinResultScreen}
        options={{ title: '피부 분석 결과' }}
      />

      <Stack.Screen
        name="CosmeticRegister"
        component={CosmeticRegisterScreen}
        options={{ title: '화장품 등록' }}
      />

      <Stack.Screen
        name="RecentResult"
        component={RecentResultScreen}
        options={{ title: '최근 분석 결과' }}
      />
    </Stack.Navigator>
  );
}
