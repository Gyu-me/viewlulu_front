/**
 * RootNavigator (최종 안정본 + MyPouch 항상 목록으로)
 * --------------------------------------------------
 * - Home / Settings UI 절대 변경 없음
 * - MyPouch 탭에서 다른 탭으로 이동하면 자동 popToTop
 * - 다시 MyPouch로 오면 항상 MyPouchScreen부터 시작
 */

import React from 'react';
import { Image, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CosmeticConfirmScreen from '../screens/CosmeticConfirmScreen';

import HomeStackNavigator from './HomeStackNavigator';
import MyPouchStackNavigator from './MyPouchStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import FeatureStackNavigator from './FeatureStackNavigator';

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
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD400',
        tabBarInactiveTintColor: '#FFFFFF',
        tabBarStyle: BASE_TAB_STYLE,
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
      {/* ================= MyPouch ================= */}
      <Tab.Screen
        name="MyPouch"
        component={MyPouchStackNavigator}
        options={({ route }) => {
          const routeName =
            getFocusedRouteNameFromRoute(route) ?? 'MyPouch';

          const hideTab =
            routeName === 'CosmeticDetect' ||
            routeName === 'CosmeticDetectResult' ||
            routeName === 'CosmeticRegister';

          return {
            // ✅ 핵심: 탭이 blur될 때 MyPouchStack을 자동 popToTop
            popToTopOnBlur: true,

            tabBarStyle: hideTab ? { display: 'none' } : BASE_TAB_STYLE,

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

      {/* ================= Home (절대 변경 없음) ================= */}
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

      {/* ================= Settings (절대 변경 없음) ================= */}
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

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
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

      <Stack.Screen
        name="CosmeticConfirm"
        component={CosmeticConfirmScreen}
        options={{ title: '화장품 확인' }}
      />

      <Stack.Screen
        name="Feature"
        component={FeatureStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
