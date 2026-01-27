/**
 * SettingsScreen (🔥 FINAL)
 * --------------------------------------------------
 * - 앱 설정 화면
 * - 앱 정보 유지
 * - ✅ 사용자 명시 동작에서만 로그아웃
 * - ✅ 서버 로그아웃 + 로컬 토큰 제거 + 네비게이션 reset
 * - ✅ Android 뒤로가기 → Home 이동
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import { colors } from '../theme/colors';
import { api } from '../api/api';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  /* 🔥 Android 뒤로가기 → Home으로 이동 */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true; // 기본 앱 종료 차단
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        subscription.remove(); // ✅ 최신 RN 방식
      };
    }, [navigation])
  );

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              const refreshToken = await AsyncStorage.getItem('refreshToken');

              if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
              }
            } catch (e) {
              console.log('[Logout] server error:', e);
            } finally {
              await AsyncStorage.multiRemove([
                'accessToken',
                'refreshToken',
                'user',
              ]);

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>설정</Text>

      <Text style={styles.sectionTitle}>앱 정보</Text>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>버전</Text>
        <Text style={styles.settingValue}>v1.0.2</Text>
      </View>

      <Text style={styles.sectionTitle}>계정</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  settingTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: 'rgba(255, 80, 80, 0.9)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    color: 'rgba(255, 80, 80, 0.95)',
    fontSize: 16,
    fontWeight: '800',
  },
});
