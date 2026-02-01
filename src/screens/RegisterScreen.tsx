/**
 * RegisterScreen (FINAL ACCESSIBLE CLEAN)
 * --------------------------------------------------
 * - 구조 안정화
 * - 스크린리더 최적화
 * - UI 정돈
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  AccessibilityInfo,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const ageRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);

  /* ===== 진입 안내 ===== */
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      '회원가입 화면입니다. 이름, 나이, 성별, 이메일, 비밀번호를 입력해주세요. 모든 항목은 필수입니다.',
    );
  }, []);

  /* ===== 회원가입 ===== */
  const handleRegister = async () => {
    if (!name || !age || !gender || !email || !password) {
      AccessibilityInfo.announceForAccessibility('모든 항목을 입력해주세요.');
      Alert.alert('입력 확인', '모든 항목을 입력해주세요.');
      return;
    }

    const ageNumber = Number(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      Alert.alert('나이 확인', '나이는 숫자로 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('비밀번호 확인', '비밀번호는 8자 이상이어야 합니다.');
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

      AccessibilityInfo.announceForAccessibility(
        '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.',
      );

      Alert.alert('회원가입 완료', '로그인 화면으로 이동합니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('회원가입 오류', '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title} accessibilityRole="header">
          회원가입
        </Text>

        {/* 이름 */}
        <Text style={styles.label}>이름 (필수)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          accessibilityLabel="이름 입력"
          returnKeyType="next"
          onSubmitEditing={() => ageRef.current?.focus()}
        />

        {/* 나이 */}
        <Text style={styles.label}>나이 (필수)</Text>
        <TextInput
          ref={ageRef}
          style={styles.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          accessibilityLabel="나이 입력"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        {/* 성별 */}
        <Text style={styles.label}>성별 (필수)</Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="성별 선택"
          style={styles.genderRow}
        >
          {(['남', '여'] as const).map(item => (
            <TouchableOpacity
              key={item}
              style={[
                styles.genderButton,
                gender === item && styles.genderSelected,
              ]}
              onPress={() => setGender(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: gender === item }}
              accessibilityLabel={item === '남' ? '남성' : '여성'}
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

        {/* 이메일 */}
        <Text style={styles.label}>이메일 (필수)</Text>
        <TextInput
          ref={emailRef}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="이메일 입력"
          returnKeyType="next"
          onSubmitEditing={() => pwRef.current?.focus()}
        />

        {/* 비밀번호 */}
        <Text style={styles.label}>비밀번호 (필수)</Text>
        <TextInput
          ref={pwRef}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="비밀번호 입력"
          returnKeyType="done"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRegister}
          accessibilityRole="button"
          accessibilityLabel="회원가입 완료"
          accessibilityHint="입력한 정보로 회원가입을 진행합니다"
          disabled={loading}
        >
          <Text style={styles.primaryText}>
            {loading ? '가입 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 32,
  },

  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
  },

  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 18,
  },

  genderRow: {
    flexDirection: 'row',
    marginBottom: 24,
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
    fontWeight: '700',
  },

  genderTextSelected: {
    color: '#000',
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 12,
  },

  primaryText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
});
