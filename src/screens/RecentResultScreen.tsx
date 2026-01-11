/**
 * RecentResultScreen (API 연동 최종본)
 * --------------------------------------------------
 * - 최근 분석 결과 목록 조회
 * - 결과 타입별 상세 화면 이동
 * - FeatureStack 흐름 유지
 */

import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getRecentResultsApi, RecentResultItem } from '../api/result.api';
import type { FeatureStackParamList } from '../navigation/FeatureStackNavigator';
import { colors } from '../theme/colors';

type Nav = NativeStackNavigationProp<FeatureStackParamList>;

export default function RecentResultScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<RecentResultItem[]>([]);

  useEffect(() => {
    getRecentResultsApi().then(setItems);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>최근 분석 결과</Text>

      {items.length === 0 && (
        <Text style={styles.emptyText}>최근 분석 결과가 없습니다.</Text>
      )}

      {items.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.card}
          onPress={() =>
            navigation.navigate(
              item.type === 'face' ? 'FaceResult' : 'SkinResult',
              { mode: 'history' },
            )
          }
        >
          <Text style={styles.cardTitle}>
            {item.type === 'face' ? '얼굴형 분석' : '피부 분석'}
          </Text>
          <Text style={styles.cardMain}>{item.summary}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },

  card: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardMain: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardDate: { color: '#888', fontSize: 12, marginTop: 6 },
});
