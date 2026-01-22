/**
 * RootNavigator (✅ FINAL STABLE + Auth Bootstrap 적용)
 * --------------------------------------------------
 * ✅ 기존 기능 100% 유지:
 * - Home / Settings UI 절대 변경 없음
 * - MyPouch 탭에서 다른 탭 이동 시 popToTop
 * - 다시 MyPouch로 오면 항상 MyPouchScreen부터 시작
 * - Android 시스템 네비게이션 바(Safe Area) 자동 대응
 * - 앱 재실행 시 자동 로그인 유지
 *
 * ✅ 이번 수정(핵심):
 * - refreshToken 존재만으로 Main 진입하지 않음
 * - 앱 부팅 시 /auth/refresh로 accessToken 재발급 성공해야 Main 진입
 * - 실패 시에만 Login으로
 * - 재빌드/핫리로드로 JS 상태가 초기화되어도 "토큰 준비 완료" 후 화면 진입
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
import CosmeticConfirmScreen from '../screens/CosmeticConfirmScreen';

import HomeStackNavigator from './HomeStackNavigator';
import MyPouchStackNavigator from './MyPouchStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import FeatureStackNavigator from './FeatureStackNavigator';

import { API_BASE_URL } from '@env';

const PouchIcon = require('../assets/pouchicon.png');
const HomeIcon = require('../assets/home.png');
const SettingsIcon = require('../assets/settings.png');

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ================= 공통 TabBar Style ================= */

const BASE_TAB_STYLE = {
  backgroundColor: '#000',
  borderTopWidth: 0.8,
  borderTopColor: 'rgba(255,255,255,0.15)',
  paddingTop: 8,
  paddingBottom: 16,
  height: 86,
};

/* ================= Tab Navigator ================= */

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD400',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: {
          ...BASE_TAB_STYLE,
          paddingBottom: BASE_TAB_STYLE.paddingBottom + insets.bottom,
          height: BASE_TAB_STYLE.height + insets.bottom,
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#000' }} />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="MyPouch"
        component={MyPouchStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'MyPouch';

          const hideTab =
            routeName === 'CosmeticDetect' ||
            routeName === 'CosmeticDetectResult' ||
            routeName === 'CosmeticDetail' ||
            routeName === 'CosmeticRegister';

          return {
            popToTopOnBlur: true,
            tabBarStyle: hideTab
              ? { display: 'none' }
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
            />
          ),
        }}
      />

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
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* ================= Root Stack ================= */

type InitialRoute = 'Login' | 'Main' | null;

export default function RootNavigator() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        // 1) refreshToken이 없으면 바로 Login
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          if (mounted) setInitialRoute('Login');
          return;
        }

        // 2) refreshToken이 있으면 "반드시" refresh로 accessToken 재발급 성공해야 Main
        //    - 여기서 성공하면 JS 재빌드/핫리로드로 메모리가 초기화돼도 accessToken을 다시 확보함
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // ✅ Authorization 절대 넣지 않음 (설계 유지)
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          // refresh 실패 => 로그인 상태로 볼 수 없음
          // (여기서 토큰을 지울지 여부는 정책인데,
          //  "실패 시에만 삭제" 규칙을 Root에서도 동일하게 적용)
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          if (mounted) setInitialRoute('Login');
          return;
        }

        const data = await res.json();

        // ✅ 백엔드가 { accessToken, refreshToken } 또는 { accessToken } 형태일 수 있으니 방어
        const newAccessToken: string | undefined = data?.accessToken;
        const newRefreshToken: string | undefined = data?.refreshToken;

        if (!newAccessToken) {
          // accessToken이 없으면 refresh 성공으로 볼 수 없음
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          if (mounted) setInitialRoute('Login');
          return;
        }

        // 3) 토큰 저장 (기존 규칙 유지: refresh 성공 시에만 갱신)
        await AsyncStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        // 4) 이제서야 Main 진입
        if (mounted) setInitialRoute('Main');
      } catch (e) {
        // 네트워크/예외 => 안전하게 로그인 화면으로 (토큰은 유지할 수도 있으나,
        // 현재 증상(재빌드 후 꼬임)을 막기 위해 "부팅 단계에서 확실히 정리"하는 쪽이 안정적)
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        if (mounted) setInitialRoute('Login');
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ⏳ 부팅/토큰 준비 중 로딩 (기존 유지)
  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD400" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="Register" component={RegisterScreen} />

      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
