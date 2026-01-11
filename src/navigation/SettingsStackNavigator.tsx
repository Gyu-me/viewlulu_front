/**
 * SettingsStackNavigator
 * --------------------------------------------------
 * 설정 탭 전용 Stack
 * (향후 접근성 설정, 음성 설정 등 확장 대비)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
