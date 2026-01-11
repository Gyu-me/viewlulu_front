/**
 * FaceResultScreen (결과 저장 연동 최종본)
 * --------------------------------------------------
 * - analysis 모드: 결과 저장 가능
 * - history 모드: 읽기 전용
 * - 기존 UI / UX / 네비게이션 흐름 유지
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { saveResultApi } from '../api/result.api';

type Nav = NativeStackNavigationProp<any>;

export default function FaceResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const mode = route.params?.mode ?? 'analysis';
  const isReadOnly = mode === 'history';

  const goHome = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  const handleSave = async () => {
    try {
      await saveResultApi({
        type: 'face',
        result: {
          oval: 38,
          round: 27,
          square: 14,
        },
      });
      goHome();
    } catch {
      Alert.alert('저장 실패', '결과 저장에 실패했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>얼굴형 분석 결과</Text>

      <ResultCard label="계란형" percent={38} />
      <ResultCard label="둥근형" percent={27} />
      <ResultCard label="각진형" percent={14} />

      <View style={styles.buttonArea}>
        {!isReadOnly && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryText}>결과 저장하기</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={goHome}>
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ResultCard({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.cardPercent}>{percent}%</Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { color: '#FFD400', fontSize: 26, fontWeight: '800', marginBottom: 20 },

  card: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: { color: '#FFD400', fontSize: 18, fontWeight: '700' },
  cardPercent: { color: '#FFD400', fontSize: 16, fontWeight: '700' },

  barBackground: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#FFD400' },

  buttonArea: { marginTop: 30, gap: 14 },
  primaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryText: { color: '#000', fontSize: 18, fontWeight: '800' },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#FFD400',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryText: { color: '#FFD400', fontSize: 16, fontWeight: '700' },
});
