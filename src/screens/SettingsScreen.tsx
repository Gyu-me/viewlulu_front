/**
 * SettingsScreen (🔥 FINAL)
 * --------------------------------------------------
 * - 앱 설정 화면
 * - 앱 정보 유지
 * - ✅ 사용자 명시 동작에서만 로그아웃
 * - ✅ 서버 로그아웃 + 로컬 토큰 제거 + 네비게이션 reset
 * - ✅ Android 뒤로가기 → Home 이동
 * - ✅ "뷰루루" 음성 호출 기능 On / Off 설정 (AsyncStorage 저장)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  BackHandler,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import { colors } from '../theme/colors';
import { api } from '../api/api';

const VOICE_WAKE_KEY = 'voiceWakeEnabled';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  /* ================= Voice Wake Toggle ================= */

  const [voiceWakeEnabled, setVoiceWakeEnabled] = useState(false);

  useEffect(() => {
    const loadSetting = async () => {
      const saved = await AsyncStorage.getItem(VOICE_WAKE_KEY);
      if (saved !== null) {
        setVoiceWakeEnabled(saved === 'true');
      }
    };
    loadSetting();
  }, []);

  const toggleVoiceWake = async (value: boolean) => {
    setVoiceWakeEnabled(value);
    await AsyncStorage.setItem(VOICE_WAKE_KEY, String(value));
  };

  /* ================= Android Back ================= */

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home');
        return true; // 기본 종료 차단
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        subscription.remove();
      };
    }, [navigation])
  );

  /* ================= Logout ================= */

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

  /* ================= Render ================= */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>설정</Text>

      {/* ================= Voice Wake ================= */}
      <Text style={styles.sectionTitle}>음성 기능</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingTitle}>“뷰루루” 음성 호출</Text>
        <Switch
          value={voiceWakeEnabled}
          onValueChange={toggleVoiceWake}
          trackColor={{ false: '#444', true: colors.primary }}
          thumbColor="#000"
        />
      </View>

      <Text style={styles.settingDesc}>
        앱 사용 중 “뷰루루”라고 말하면 음성 기능이 실행됩니다.
      </Text>

      {/* ================= App Info ================= */}
      <Text style={styles.sectionTitle}>앱 정보</Text>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>버전</Text>
        <Text style={styles.settingValue}>v1.0.2</Text>
      </View>

      {/* ================= Account ================= */}
      <Text style={styles.sectionTitle}>계정</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= Styles ================= */

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
    marginBottom: 12,
  },
  settingCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  settingRow: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  settingValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  settingDesc: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 20,
    paddingHorizontal: 4,
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
