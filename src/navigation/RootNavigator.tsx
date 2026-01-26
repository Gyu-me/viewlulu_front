/**
 * RootNavigator (🔥 REAL FINAL STABLE - CaptureStack 분리 버전)
 * --------------------------------------------------
 * ✅ 기존 기능 100% 유지:
 * - Home / Settings UI 절대 변경 없음
 * - MyPouch 탭에서 다른 탭 이동 시 popToTop
 * - 다시 MyPouch로 오면 항상 MyPouchScreen부터 시작
 * - Android 시스템 네비게이션 바(Safe Area) 자동 대응
 *
 * ✅ 로그인 유지 로직(토큰 삭제 금지) 유지:
 * - 네트워크/일시 실패를 로그아웃으로 처리 ❌
 * - RootNavigator에서 refresh 실패 시 토큰 삭제 ❌
 * - refreshToken이 있으면 Main 진입 유지 (카카오톡 방식)
 *
 * ✅ NEW:
 * - RootStack에 CaptureStack 추가 (탭바 밖)
 * - CaptureStack: CosmeticDetect / CosmeticRegister / CosmeticConfirm
 *   → 촬영 플로우 화면에서는 탭바가 절대 보이지 않음
 *
 * ⚠️ IMPORTANT:
 * - MyPouch / Home으로 전달되는 params(refresh 등)는
 *   RootNavigator / MainTabs에서 절대 소실되지 않도록 유지
 */

import React, { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import HomeStackNavigator from './HomeStackNavigator';
import MyPouchStackNavigator from './MyPouchStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import CaptureStackNavigator from './CaptureStackNavigator';

import { API_BASE_URL } from '@env';

const PouchIcon = require('../assets/pouchicon.png');
const HomeIcon = require('../assets/home.png');
const SettingsIcon = require('../assets/settings.png');

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ================= Tab Style ================= */

const BASE_TAB_STYLE = {
  backgroundColor: '#000',
  borderTopWidth: 0.8,
  borderTopColor: 'rgba(255,255,255,0.15)',
  paddingTop: 8,
  paddingBottom: 16,
  height: 86,
};

/* ================= Main Tabs ================= */

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD400',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          ...BASE_TAB_STYLE,
          paddingBottom: BASE_TAB_STYLE.paddingBottom + insets.bottom,
          height: BASE_TAB_STYLE.height + insets.bottom,
        },
      }}
    >
      <Tab.Screen
        name="MyPouchTab"
        component={MyPouchStackNavigator}
        options={({ route }) => {
          getFocusedRouteNameFromRoute(route); // 상태 보존 목적

          return {
            popToTopOnBlur: true,
            tabBarIcon: ({ focused }) => (
              <Image
                source={PouchIcon}
                style={{
                  width: 26,
                  height: 26,
                  tintColor: focused ? '#FFD400' : '#FFFFFF',
                }}
              />
            ),
          };
        }}
      />

      <Tab.Screen
        name="HomeTab"
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
            />
          ),
        }}
      />

      <Tab.Screen
        name="SettingsTab"
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
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* ================= Root ================= */

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] =
    useState<'Login' | 'MainTabs' | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!refreshToken) {
        mounted && setInitialRoute('Login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.accessToken) {
            await AsyncStorage.setItem('accessToken', data.accessToken);
          }
          if (data?.refreshToken) {
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
          }
        }
      } catch {
        // ❗ 실패해도 로그아웃 처리하지 않음 (의도된 설계)
      }

      mounted && setInitialRoute('MainTabs');
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  return (
    <RootStack.Navigator initialRouteName={initialRoute}>
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="CaptureStack"
        component={CaptureStackNavigator}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
