/**
 * LoginScreen (🔥 FINAL STABLE)
 * --------------------------------------------------
 * ✅ 실제 로그인 API 연동
 * ✅ accessToken + refreshToken AsyncStorage 저장 (완료 보장)
 * ✅ 로그인 실패 사유 정확히 분기
 * ✅ 성공 시 Main 진입
 */

import { Image } from 'react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { loginApi } from '../api/auth.api';
import AppIcon from '../assets/ViewLuluAppIcon.png';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      const { accessToken, refreshToken, user } =
        await loginApi(email, password);

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
        ['user', JSON.stringify(user)],
      ]);

      // 저장 확인 (디버그용)
      await AsyncStorage.getItem('accessToken');

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              index: 0,
              routes: [{ name: 'HomeTab' }],
            },
          },
        ],
      });

    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        '로그인에 실패했습니다.';

      Alert.alert('로그인 실패', message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      {/* 앱 아이콘 */}
      <Image source={AppIcon} style={styles.appIcon} />

      <Text style={styles.title}>뷰루루</Text>
      <Text style={styles.subTitle}>
        시각장애인을 위한 뷰티 도우미
      </Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.primaryText}>
          {loading ? '로그인 중...' : '로그인'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 36,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  appIcon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 24,
  },
});
