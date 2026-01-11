/**
 * LoginScreen (API 연동 최종본)
 * --------------------------------------------------
 * - 실제 로그인 API 연동
 * - JWT AsyncStorage 저장
 * - 성공 시 Main 진입
 */

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
    const { token, user } = await loginApi(email, password);

    await AsyncStorage.setItem('accessToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    navigation.replace('Main');
  } catch (err: any) {
    const message = err?.response?.data?.message;

    if (
      message?.includes('존재하지') ||
      message?.includes('not found')
    ) {
      Alert.alert(
        '계정을 찾을 수 없습니다',
        '회원가입을 진행하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '회원가입',
            onPress: () => navigation.navigate('Register'),
          },
        ],
      );
    } else {
      Alert.alert('로그인 실패', message ?? '서버 오류');
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>뷰루루</Text>
      <Text style={styles.subTitle}>시각장애인을 위한 뷰티 도우미</Text>

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

          {/* 로그인 버튼 아래 추가 */}
          <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
          >
          <Text style={styles.registerText}>회원가입</Text>
             </TouchableOpacity>
    </View>
  );
}


/* ================= 스타일 ================= */

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
}
});
