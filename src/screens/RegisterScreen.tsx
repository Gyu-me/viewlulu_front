/**
 * RegisterScreen (회원가입 최종본)
 * --------------------------------------------------
 * - 이름 / 나이 / 성별 / 이메일 / 비밀번호 입력
 * - 백엔드 회원가입 API 연동
 * - 성공 시 로그인 화면으로 이동
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

import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { registerApi } from '../api/auth.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'남' | '여' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !age || !gender || !email || !password) {
      Alert.alert('입력 확인', '모든 항목을 입력해주세요.');
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        '이메일 확인',
        '이메일 형식이 올바르지 않습니다.\n예: example@email.com'
      );
      return;
    }

    // 나이 검사
    const ageNumber = Number(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      Alert.alert(
        '나이 확인',
        '나이는 숫자로 입력해주세요.\n예: 25'
      );
      return;
    }

    // 비밀번호 검사
    if (password.length < 8) {
      Alert.alert(
        '비밀번호 확인',
        '비밀번호는 8자 이상이어야 합니다.\n숫자와 문자를 함께 사용하면 더 안전합니다.'
      );
      return;
    }

    try {
      setLoading(true);

      await registerApi({
        name,
        email,
        password,
        age: ageNumber,
        gender,
      });

      Alert.alert(
        '회원가입 완료',
        '가입이 완료되었습니다.\n로그인 화면으로 이동합니다.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message;

      let message =
        '회원가입 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';

      if (serverMessage === 'EMAIL_ALREADY_EXISTS') {
        message =
          '이미 사용 중인 이메일입니다.\n다른 이메일을 입력해주세요.';
      }

      Alert.alert('회원가입 안내', message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      {/* 이름 (한글 입력 문제 해결 포인트) */}
      <TextInput
        style={styles.input}
        placeholder="이름"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        textContentType="name"
      />

      <TextInput
        style={styles.input}
        placeholder="나이"
        placeholderTextColor="#777"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
      />

      {/* 성별 선택 */}
      <Text style={styles.label}>성별</Text>
      <View style={styles.genderRow}>
        {(['남', '여'] as const).map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.genderButton,
              gender === item && styles.genderSelected,
            ]}
            onPress={() => setGender(item)}
          >
            <Text
              style={[
                styles.genderText,
                gender === item && styles.genderTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        placeholder="비밀번호 (8자 이상)"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.primaryText}>
          {loading ? '가입 중...' : '회원가입'}
        </Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 28,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
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

  genderRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  genderButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginRight: 12,
    alignItems: 'center',
  },

  genderSelected: {
    backgroundColor: colors.primary,
  },

  genderText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  genderTextSelected: {
    color: '#000',
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
});
