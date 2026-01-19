/**
 * HomeScreen (FIRST DEPLOYMENT STABLE)
 * --------------------------------------------------
 *  첫 배포용 최소 기능 구성
 *
 * [유지]
 * - 화장품 등록
 * - 화장품 인식
 * - 나의 파우치 요약
 *   · 전체 개수
 *   · 가장 오래된 화장품 등록일
 *   · 최근 추가된 화장품 이름
 *
 * [제외 - 주석처리함]
 * - 얼굴형 분석
 * - 최근 분석 결과
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
        setLatest(sorted[sorted.length - 1].cosmeticName);
        setOldest(sorted[0].createdAt);
      } catch {}
    };

    fetchSummary();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ViewLulu</Text>

      {/* 가이드 카드 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>
          뷰루루를 통해 화장품을 등록하고,{'\n'}
          관리하고, 자신을 가꿔보세요!
        </Text>
        <Text style={styles.guideDesc}>
          얼굴형 체크를 통해{'\n'}
          나에게 어울리는 화장법을 알아보세요
        </Text>
      </View>

      {/* 기능 버튼 */}
      <View style={styles.actionRow}>
        <ActionButton
          label="화장품 등록"
          onPress={() =>
            navigation.navigate('Feature', {
              screen: 'CosmeticRegister',
            })
          }
        />
        {/* 주석처리
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

      {/* 최근 분석 결과 */}
      {/* 주석처리 <TouchableOpacity
        style={styles.recentCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('Feature', {
            screen: 'RecentResult',
          })
        }
      >
        <Text style={styles.recentTitle}>최근 분석 결과</Text>
        <Text style={styles.recentLink}>탭하여 자세히 보기 →</Text>
      </TouchableOpacity>*/}

      {/* 오늘의 파우치 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>오늘의 파우치</Text>

        {count === 0 ? (
          <Text style={styles.summaryEmpty}>
            아직 등록된 화장품이 없어요
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
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 20,
    paddingTop: 48,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },

  guideCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  guideDesc: {
    color: '#A0A0A0',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FFD60A',
    borderRadius: 16,
    paddingVertical: 18,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.3,
  },

  recentCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recentTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  recentLink: {
    color: '#FFD60A',
    fontSize: 13,
    textAlign: 'right',
    fontWeight: '500',
  },

  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    color: '#FFD60A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  summarySub: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  summaryEmpty: {
    color: '#8E8E93',
    fontSize: 14,
    letterSpacing: -0.2,
  },
});