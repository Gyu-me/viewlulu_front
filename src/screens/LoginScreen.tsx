/**
 * LoginScreen (🔥 ACCESSIBILITY FINAL + ERROR SAFE)
 * --------------------------------------------------
 * ✅ 스크린 리더 완전 대응
 * ✅ 키보드 가림 문제 해결
 * ✅ 접근성 속성 명시 (Label / Hint / Role)
 * ✅ Blur 제거 → 에러 원천 차단
 */
/**
 * LoginScreen (🔥 ACCESSIBILITY FINAL + ERROR SAFE)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  AccessibilityInfo,
  Keyboard,
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
  const [focused, setFocused] = useState(false);

  const translateY = useRef(new Animated.Value(0)).current;
  const passwordRef = useRef<TextInput>(null);

  const handleFocus = (label: string) => {
    setFocused(true);

    AccessibilityInfo.announceForAccessibility(
      `${label} 입력 중입니다. 키보드가 열렸습니다.`
    );
  };


  // ⭐ 키보드 닫히면 무조건 원상복귀
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      Animated.timing(translateY, {
        toValue: -65,
        duration: 250,
        useNativeDriver: true,
      }).start();

      setFocused(true);
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();

      setFocused(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);


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

      // (선택) 저장 확인용
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
      const serverMessage = err?.response?.data?.message;
      const errorMessage = err?.message;

      let title = '로그인 안내';
      let message =
        '로그인 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.';

      if (serverMessage === 'USER_NOT_FOUND') {
        message =
          '입력하신 이메일로 가입된 계정을 찾을 수 없습니다.\n회원가입 후 이용해주세요.';
      } else if (serverMessage === 'INVALID_PASSWORD') {
        message =
          '비밀번호가 올바르지 않습니다.\n다시 한 번 확인해주세요.';
      } else if (
        serverMessage === 'TOKEN_EXPIRED' ||
        serverMessage === 'UNAUTHORIZED'
      ) {
        title = '로그인 필요';
        message =
          '보안을 위해 다시 로그인이 필요합니다.\n확인을 누르면 로그인 화면으로 이동합니다.';
      } else if (errorMessage === 'Network Error') {
        title = '연결 오류';
        message =
          '인터넷 연결이 원활하지 않습니다.\n네트워크 상태를 확인한 후 다시 시도해주세요.';
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        {focused && <View style={styles.dim} pointerEvents="none" />}

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image source={AppIcon} style={styles.appIcon} accessible={false} />

          <Text style={styles.title} accessibilityRole="header">
            뷰루루
          </Text>

          <Text style={styles.subTitle}>
            시각장애인을 위한 뷰티 도우미
          </Text>

          <Animated.View
            style={[styles.formArea, { transform: [{ translateY }] }]}
          >
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              accessibilityLabel="이메일 입력"
              accessibilityHint="로그인에 사용할 이메일 주소를 입력하세요"
              onFocus={() => handleFocus('이메일')}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              accessibilityLabel="비밀번호 입력"
              accessibilityHint="로그인 비밀번호를 입력하세요"
              onFocus={() => handleFocus('비밀번호')}
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="로그인"
            >
              <Text style={styles.primaryText}>
                {loading ? '로그인 중...' : '로그인'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              accessibilityLabel="회원가입"
            >
              <Text style={styles.registerText}>회원가입</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}


/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'flex-start',
    paddingTop: 170,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  formArea: {
    marginTop: 10,
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
    backgroundColor : '#000'
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
