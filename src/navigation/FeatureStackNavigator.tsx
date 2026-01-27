/**
 * FeatureStackNavigator
 * --------------------------------------------------
 *
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import FaceAnalysisScreen from '../screens/FaceAnalysisScreen';
import FaceResultScreen from '../screens/FaceResultScreen';
import SkinAnalysisScreen from '../screens/SkinAnalysisScreen';
import SkinResultScreen from '../screens/SkinResultScreen';
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
        name="FaceAnalysis"
        component={FaceAnalysisScreen}
        options={{ title: '얼굴형 분석', headerShown: false}}
      />

      <Stack.Screen
        name="FaceResult"
        component={FaceResultScreen}
        options={{ title: '얼굴형 분석 결과', headerShown: false}}
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
        name="RecentResult"
        component={RecentResultScreen}
        options={{ title: '최근 분석 결과', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
