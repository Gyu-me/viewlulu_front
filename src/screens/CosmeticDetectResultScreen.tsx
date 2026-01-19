/**
 * CosmeticDetectResultScreen (🔥 최종 안전본)
 * --------------------------------------------------
 * ✅ cosmeticId 기반 서버 조회
 * ✅ 화면 이탈 시 상태 완전 초기화
 * ✅ 잘못된 진입 / 서버 오류 / 재진입 모두 방어
 * ✅ 응답 필드 호환: cosmeticName/name 둘 다 처리
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
import { getCosmeticDetailApi, CosmeticDetail } from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';

type Route = RouteProp<MyPouchStackParamList, 'CosmeticDetectResult'>;
type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

export default function CosmeticDetectResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();

  // ✅ 들어오는 cosmeticId가 number/string일 수 있음
  const cosmeticIdRaw = route.params?.cosmeticId as any;
  const cosmeticId =
    cosmeticIdRaw !== undefined && cosmeticIdRaw !== null
      ? String(cosmeticIdRaw)
      : null;

  const [loading, setLoading] = useState(true);
  const [cosmetic, setCosmetic] = useState<CosmeticDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setCosmetic(null);
        setLoading(true);
      };
    }, [])
  );

  useEffect(() => {
    if (!cosmeticId) return;

    let isActive = true;

    getCosmeticDetailApi(cosmeticId)
      .then((data) => {
        if (isActive) setCosmetic(data);
      })
      .catch((e: any) => {
        console.log('[CosmeticDetectResultScreen][getCosmeticDetailApi error]', e);

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
        <Text style={styles.title}>인식 결과</Text>
        <Text style={styles.desc}>화장품 정보를 불러올 수 없습니다.</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ 호환: cosmeticName 우선, 없으면 name
  const displayName = cosmetic.cosmeticName || cosmetic.name;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>인식 결과</Text>

      <Text style={styles.desc}>
        이 화장품은{'\n'}
        <Text style={{ fontWeight: '800' }}>{displayName}</Text>
        입니다.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.replace('CosmeticDetail', {
            cosmeticId: cosmetic.cosmeticId, // ✅ 정규화된 값 사용
          })
        }
      >
        <Text style={styles.primaryText}>상세 정보 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.popToTop()}
      >
        <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  /* ===== Primary (그대로 유지) ===== */
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

  /* ===== Secondary (🔥 여기만 변경) ===== */
  secondaryButton: {
    backgroundColor: colors.primary, // 🔥 노란색 채움
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#000', // 🔥 검정색 글자
    fontSize: 14,
    fontWeight: '600',
  },
});

