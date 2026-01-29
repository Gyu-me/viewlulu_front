/**
 * RootNavigator (🔥 REAL FINAL STABLE - CaptureStack 분리 버전)
 * --------------------------------------------------
 * ✅ 기존 기능 100% 유지:
 * - Home / Settings UI 절대 변경 없음
 * - MyPouch 탭에서 다른 탭 이동 시 popToTop
 * - 다시 MyPouch로 오면 항상 MyPouchScreen부터 시작
 * - Android 시스템 네비게이션 바(Safe Area) 자동 대응
 *
 * ✅ 로그인 유지 로직 (🔥 api.ts 단일 책임):
 * - RootNavigator에서 auth/refresh 호출 ❌
 * - refresh 실패 / 네트워크 오류 → 로그아웃 ❌
 * - refreshToken이 "존재"하면 무조건 MainTabs 진입
 * - 실제 인증 판단은 api.ts 인터셉터가 전담
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
import { subscribeAuthChanged } from './authEvents';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import HomeStackNavigator from './HomeStackNavigator';
import MyPouchStackNavigator from './MyPouchStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import FeatureStackNavigator from './FeatureStackNavigator';
import CaptureStackNavigator from './CaptureStackNavigator';

const PouchIcon = require('../assets/pouchicon.png');
const HomeIcon = require('../assets/home.png');
const SettingsIcon = require('../assets/settings.png');

// 🔹 Root Stack Param List (Navigation Type Safety)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  FeatureStack: undefined;
  CaptureStack: undefined;
};

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
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MyPouch';

          const hideTabBar = routeName === 'CosmeticDetail';

          return {
            popToTopOnBlur: true,
            tabBarStyle: hideTabBar
              ? { ...BASE_TAB_STYLE, display: 'none' }
              : {
                  ...BASE_TAB_STYLE,
                  paddingBottom: BASE_TAB_STYLE.paddingBottom + insets.bottom,
                  height: BASE_TAB_STYLE.height + insets.bottom,
                },
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
  const [initialRoute, setInitialRoute] = useState<'Login' | 'MainTabs' | null>(
    null,
  );

  useEffect(() => {
    const recheck = async () => {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const accessToken = await AsyncStorage.getItem('accessToken');

      // ✅ accessToken 기준으로만 로그인 UI 판단
      setInitialRoute(accessToken ? 'MainTabs' : 'Login');
    };

    const unsub = subscribeAuthChanged(() => {
      recheck();
    });

    return unsub;
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      /**
       * 🔥 RootNavigator의 역할은 단 하나
       * - "로그인 UI를 보여줄지"만 판단
       * - 인증 유효성 판단 ❌ (api.ts가 전담)
       */
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!mounted) return;

      // ✅ refreshToken이 있으면 무조건 MainTabs
      // (accessToken 유효성 / 재발급은 api.ts 인터셉터가 처리)
      setInitialRoute(refreshToken ? 'MainTabs' : 'Login');
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

  return initialRoute === 'MainTabs' ? (
    <RootStack.Navigator>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="FeatureStack"
        component={FeatureStackNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="CaptureStack"
        component={CaptureStackNavigator}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  ) : (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen name="Register" component={RegisterScreen} />
    </RootStack.Navigator>
  );
}
