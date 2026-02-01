/**
 * CosmeticDetectResultScreen (🔥 CaptureStack 종료 기준 최종본)
 * --------------------------------------------------
 * ✅ cosmeticId 기반 서버 조회
 * ✅ 화면 이탈 시 상태 완전 초기화
 * ✅ 잘못된 진입 / 서버 오류 / 재진입 모두 방어
 * ✅ 🔥 뒤로가기 시 앱 종료 방지 (무조건 MyPouch)
 *
 * ♿ 접근성 개선 (시각장애인 UX)
 * - 인식 결과 로딩 완료 후 1회 TTS로 결과 요약 안내
 *   → "이 화장품은 ○○○ 입니다."
 * - 결과 화면에서는 스크린리더 허용
 * - 상단 제목(header) + 버튼(role=button) 중심 탐색
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import Tts from 'react-native-tts';

import { colors } from '../theme/colors';
import { getCosmeticDetailApi, CosmeticDetail } from '../api/cosmetic.api';

type Route = RouteProp<any, 'CosmeticDetectResult'>;

export default function CosmeticDetectResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const cosmeticIdRaw = route.params?.cosmeticId as any;
  const cosmeticId =
    cosmeticIdRaw !== undefined && cosmeticIdRaw !== null
      ? String(cosmeticIdRaw)
      : null;

  const [loading, setLoading] = useState(true);
  const [cosmetic, setCosmetic] = useState<CosmeticDetail | null>(null);

  /** 🔊 결과 TTS 1회 실행 여부 */
  const hasSpokenRef = useRef(false);

  /* ================= 🔥 Back Handling (무조건 MyPouch) ================= */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                routes: [{ name: 'HomeTab' }],
              },
            },
          ],
        });
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => sub.remove();
    }, [navigation]),
  );

  /* ================= Data Fetch ================= */
  useEffect(() => {
    if (!cosmeticId) return;

    let isActive = true;

    getCosmeticDetailApi(cosmeticId)
      .then(data => {
        if (isActive) setCosmetic(data);
      })
      .catch((e: any) => {
        if (!isActive) return;

        const msg =
          e?.message === 'NO_TOKEN'
            ? '로그인이 만료되었습니다. 다시 로그인해주세요.'
            : '화장품 정보를 불러오지 못했습니다.';

        Alert.alert('조회 실패', msg);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [cosmeticId]);

  /* ================= 🔊 Result TTS (요약 1회 + 접근성 잠금) ================= */
  useEffect(() => {
    if (!cosmetic) return;
    if (hasSpokenRef.current) return;

    const name = cosmetic.cosmeticName || cosmetic.name;
    if (!name) return;

    hasSpokenRef.current = true;

    // 🔒 TTS 동안 스크린리더 잠금
    setScreenReaderEnabled(false);

    Tts.stop();
    Tts.speak(`이 화장품은 ${name} 입니다.`);
  }, [cosmetic]);

  /* ================= 🔊 TTS 종료 시 접근성 해제 ================= */
  useEffect(() => {
    const onFinish = () => {
      setScreenReaderEnabled(true);
    };

    const subscription = Tts.addEventListener('tts-finish', onFinish);

    return () => {
      subscription?.remove();
    };
  }, []);

  /* ================= Navigation Helpers ================= */

  const exitToMain = () => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          state: {
            routes: [{ name: 'HomeTab' }],
          },
        },
      ],
    });
  };

  const exitToMyPouch = () => {
    if (!cosmeticId) return;

    navigation.navigate('MainTabs', {
      screen: 'MyPouchTab',
      params: {
        screen: 'CosmeticDetail',
        params: {
          cosmeticId,
          fromDetect: true,
        },
      },
    });
  };

  /* ================= Render ================= */

  if (!cosmeticId) {
    return (
      <View
        style={styles.container}
        importantForAccessibility={
          screenReaderEnabled ? 'auto' : 'no-hide-descendants'
        }
      >
        <Text style={styles.title} accessibilityRole="header">
          인식 결과
        </Text>

        <Text style={styles.desc}>
          내 파우치에 해당 화장품 정보가 없습니다.{'\n'}
          다시 시도해주세요.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={exitToMain}
          accessibilityRole="button"
          accessibilityLabel="홈으로 돌아가기"
        >
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.primary, marginTop: 12 }}>
          인식 결과 불러오는 중...
        </Text>
      </View>
    );
  }

  if (!cosmetic) {
    return (
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          인식 결과
        </Text>

        <Text style={styles.desc}>화장품 정보를 불러올 수 없습니다.</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={exitToMain}
          accessibilityRole="button"
          accessibilityLabel="홈으로 돌아가기"
        >
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = cosmetic.cosmeticName || cosmetic.name;

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        인식 결과
      </Text>

      <Text style={styles.desc}>
        이 화장품은{'\n'}
        <Text style={{ fontWeight: '800' }}>{displayName}</Text>
        입니다.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={exitToMyPouch}
        accessibilityRole="button"
        accessibilityLabel="화장품 정보 보기"
      >
        <Text style={styles.primaryText}>화장품 정보 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={exitToMain}
        accessibilityRole="button"
        accessibilityLabel="홈으로 돌아가기"
      >
        <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  desc: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});
