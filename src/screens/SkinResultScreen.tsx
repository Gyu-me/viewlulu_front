/**
 * SkinResultScreen (결과 저장 API 연동 최종본)
 * --------------------------------------------------
 * - 피부 분석 결과 표시
 * - analysis 모드: 결과 저장 가능
 * - history 모드: 읽기 전용
 * - 기존 UI / UX / 네비게이션 흐름 100% 유지
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { saveResultApi } from '../api/result.api';

type Nav = NativeStackNavigationProp<any>;

export default function SkinResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  /** 진입 모드 (analysis | history) */
  const mode = route.params?.mode ?? 'analysis';
  const isReadOnly = mode === 'history';

  /** 홈으로 복귀 */
  const goHome = () => {
    navigation.replace('Main', {
      screen: 'Home',
    });
  };

  /** 결과 저장 */
  const handleSave = async () => {
    try {
      await saveResultApi({
        type: 'skin',
        result: {
          skinType: '복합성',
          issues: ['여드름', '홍조'],
          recommendation: '진정 + 유분 조절',
        },
      });
      goHome();
    } catch {
      Alert.alert('저장 실패', '피부 분석 결과 저장에 실패했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>피부 분석 결과</Text>

      <ResultCard
        title="피부 타입"
        value="복합성 (T존 지성 / U존 건성)"
        desc="유분과 수분 밸런스 관리가 중요합니다."
      />

      <ResultCard
        title="특이 사항"
        value="여드름 · 홍조"
        desc="이마와 볼에 트러블, 턱에 약한 홍조가 관찰됩니다."
      />

      <ResultCard
        title="추천 케어"
        value="진정 + 유분 조절"
        desc="저자극 진정 토너와 가벼운 수분 크림을 권장합니다."
      />

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

/* ================= 서브 컴포넌트 ================= */

function ResultCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },

  title: {
    color: '#FFD400',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },

  card: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    color: '#FFD400',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardDesc: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
  },

  buttonArea: {
    marginTop: 30,
    gap: 14,
  },

  primaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },

  primaryText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },

  secondaryButton: {
    borderWidth: 2,
    borderColor: '#FFD400',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },

  secondaryText: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '700',
  },
});
