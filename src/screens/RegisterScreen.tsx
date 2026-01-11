/**
 * RegisterScreen (회원가입)
 * --------------------------------------------------
 * - 기본 회원 정보 입력
 * - 성별 Radio 선택
 * - 회원가입 API 요청
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
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // 🔗 추후 서버 연동
      /*
      await registerApi({
        name,
        age: Number(age),
        gender,
        email,
        password,
      });
      */

      Alert.alert('회원가입 완료', '로그인 화면으로 이동합니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('회원가입 실패', e?.response?.data?.message ?? '서버 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
        keyboardType="default"
        autoCorrect={false}
        autoCapitalize="none"
        textContentType="none"
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
        placeholder="비밀번호"
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
