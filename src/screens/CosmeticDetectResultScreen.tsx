/**
 * CosmeticDetectResultScreen (🔥 최종 안전본)
 * --------------------------------------------------
 * - cosmeticId 기반 서버 조회
 * - Tab 이동 / 화면 이탈 시 상태 완전 초기화
 * - 잘못된 진입 / 서버 오류 / 재진입 모두 방어
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import {
  getCosmeticDetailApi,
  CosmeticDetail,
} from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';

/* ================= 타입 ================= */

type Route = RouteProp<MyPouchStackParamList, 'CosmeticDetectResult'>;
type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

/* ================= 화면 ================= */

export default function CosmeticDetectResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();

  /** 🔑 단일 ID 개념 */
  const cosmeticId = route.params?.cosmeticId;

  const [loading, setLoading] = useState(true);
  const [cosmetic, setCosmetic] = useState<CosmeticDetail | null>(null);

  /* ================= 라이프사이클 관리 ================= */

  // 🔥 화면 이탈 시 상태 초기화 (탭 이동 / 홈 이동 대응)
  useFocusEffect(
    useCallback(() => {
      return () => {
        setCosmetic(null);
        setLoading(true);
      };
    }, [])
  );

  /* ================= 데이터 로딩 ================= */

  useEffect(() => {
    if (!cosmeticId) return;

    let isActive = true;

    getCosmeticDetailApi(cosmeticId)
      .then((data) => {
        if (isActive) setCosmetic(data);
      })
      .catch(() => {
        if (isActive) {
          Alert.alert(
            '조회 실패',
            '화장품 정보를 불러오지 못했습니다.'
          );
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [cosmeticId]);

  /* ================= 예외 방어 ================= */

  // ❌ 잘못된 진입
  if (!cosmeticId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>인식 결과</Text>
        <Text style={styles.desc}>
          인식된 화장품 정보가 없습니다.{'\n'}
          다시 시도해주세요.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.secondaryText}>파우치로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ⏳ 로딩
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

  // ❌ 서버 오류
  if (!cosmetic) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>인식 결과</Text>
        <Text style={styles.desc}>
          화장품 정보를 불러올 수 없습니다.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.secondaryText}>파우치로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ================= 정상 화면 ================= */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>인식 결과</Text>

      <Text style={styles.desc}>
        이 화장품은{'\n'}
        <Text style={{ fontWeight: '800' }}>
          {cosmetic.name}
        </Text>
        입니다.
      </Text>

      {/* 상세 정보 이동 */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.replace('CosmeticDetail', {
            cosmeticId,
          })
        }
      >
        <Text style={styles.primaryText}>상세 정보 보기</Text>
      </TouchableOpacity>

      {/* 파우치 복귀 */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.secondaryText}>파우치로 돌아가기</Text>
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
    marginBottom: 14,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
