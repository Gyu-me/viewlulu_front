/**
 * RootNavigator (최종 통일본)
 * --------------------------------------------------
 * - 모든 탭 하단바 스타일 완전 통일
 * - MyPouch만 다르게 보이던 문제 완전 제거
 * - 하단 네비게이터 분리선 + 여백 추가
 *
 * ⚠️ 하단바 위치/여백은 추후 수동 조절 가능
 *     → tabBarStyle 내부 주석 참고
 */

import React from 'react';
import { Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

/* Screens */
import LoginScreen from '../screens/LoginScreen';

/* Tab Stacks */
import HomeStackNavigator from './HomeStackNavigator';
import MyPouchStackNavigator from './MyPouchStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';

/* Feature Stack */
import FeatureStackNavigator from './FeatureStackNavigator';

/* Icons */
const PouchIcon = require('../assets/pouchicon.png');
const HomeIcon = require('../assets/home.png');
const SettingsIcon = require('../assets/settings.png');

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ================= Bottom Tab ================= */

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,

        /* 색상 */
        tabBarActiveTintColor: '#FFD400',
        tabBarInactiveTintColor: '#FFFFFF',

        /* ⭐ 하단바 스타일 (여기서만 정의) */
        tabBarStyle: {
          backgroundColor: '#000',

          /* ───────── 분리선 (조절 가능) ───────── */
          borderTopWidth: 0.8, // ← 분리선 두께
          borderTopColor: 'rgba(255,255,255,0.15)', // ← 분리선 색상

          /* ───────── 위/아래 여백 (조절 가능) ───────── */
          paddingTop: 8,      // ← 아이콘을 위로 올리고 싶으면 증가
          paddingBottom: 16,  // ← 홈 인디케이터와 간격

          height: 86,         // ← 하단바 전체 높이
          elevation: 0,       // Android 그림자 제거
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4, // ← 아이콘-라벨 간격 조절 가능
        },
      }}
    >
      {/* MyPouch */}
      <Tab.Screen
        name="MyPouch"
        component={MyPouchStackNavigator}
        options={({ route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? 'MyPouch';

          const hideTabScreens = [
            'CosmeticDetect',
            'CosmeticDetectResult',
          ];

          return {
            /* ❗ tabBarStyle 직접 수정 금지 (통일성 유지) */
            tabBarItemStyle: {
              display: hideTabScreens.includes(routeName)
                ? 'none'
                : 'flex',
            },

            tabBarIcon: ({ focused }) => (
              <Image
                source={PouchIcon}
                style={{
                  width: 26,
                  height: 26,
                  tintColor: focused ? '#FFD400' : '#FFFFFF',
                }}
                resizeMode="contain"
              />
            ),
          };
        }}
      />

      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={HomeIcon}
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? '#FFD400' : '#FFFFFF',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Settings */}
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={SettingsIcon}
              style={{
                width: 26,
                height: 26,
                tintColor: focused ? '#FFD400' : '#FFFFFF',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* ================= Root Stack ================= */

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        animation: 'slide_from_right',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />

      {/* 기능 전용 영역 (Tab 없음) */}
      <Stack.Screen
        name="Feature"
        component={FeatureStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
