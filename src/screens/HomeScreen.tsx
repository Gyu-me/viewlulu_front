/**
 * HomeScreen (가이드 + 요약 강화본)
 * --------------------------------------------------
 * - 상단: 서비스 가이드 카드
 * - 중단: 기능 버튼 (화장품 중심)
 * - 하단: 오늘의 파우치 요약 (서버 데이터)
 *
 * ⚠️ 분석 기능은 주석 처리 (추후 복구 예정)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CosmeticItem = {
  cosmeticName: string;
  createdAt: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<string | null>(null);
  const [oldest, setOldest] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data: CosmeticItem[] = await getMyCosmeticsApi();
        if (data.length === 0) return;

        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );

        setCount(data.length);
        setOldest(sorted[0].createdAt);
        setLatest(sorted[sorted.length - 1].cosmeticName);
      } catch {
        // 홈에서는 조용히 실패 무시
      }
    };

    fetchSummary();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈</Text>

      {/* ① 가이드 카드 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>화장품 등록 → 분석 → 관리</Text>
        <Text style={styles.guideDesc}>
          가지고 있는 화장품을{'\n'}
          사진으로 등록하고 편하게 관리하세요
        </Text>
      </View>

      {/* ② 기능 버튼 */}
      <View style={styles.actionRow}>
        <ActionButton
          label="화장품 등록"
          onPress={() =>
            navigation.navigate('Feature', {
              screen: 'CosmeticRegister',
            })
          }
        />

        {/*
        <ActionButton
          label="얼굴형 분석"
          onPress={() =>
            navigation.navigate('Feature', {
              screen: 'FaceAnalysis',
            })
          }
        />
        */}
      </View>

      {/* ③ 오늘의 파우치 요약 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>오늘의 파우치</Text>

        {count === 0 ? (
          <Text style={styles.summaryEmpty}>
            아직 등록된 화장품이 없습니다
          </Text>
        ) : (
          <>
            <Text style={styles.summaryText}>
              등록된 화장품 {count}개
            </Text>
            <Text style={styles.summarySub}>
              최근 등록: {latest}
            </Text>
            <Text style={styles.summarySub}>
              가장 오래된 등록일:{' '}
              {oldest && new Date(oldest).toLocaleDateString()}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/* 버튼 */
const ActionButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 28,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  guideCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  guideTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guideDesc: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  summaryCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 18,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 6,
  },
  summarySub: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 2,
  },
  summaryEmpty: {
    color: '#fff',
    opacity: 0.6,
    fontSize: 14,
  },
});
