/**
 * SettingsScreen (정리 완료본)
 * --------------------------------------------------
 * - 앱 설정 화면
 * - 현재: 앱 정보만 유지
 * - 불필요한 기능/JSX 완전 제거
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 상단 타이틀 */}
      <Text style={styles.title}>설정</Text>

      {/* ================= 앱 정보 ================= */}
      <Text style={styles.sectionTitle}>앱 정보</Text>

      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>버전</Text>
        <Text style={styles.settingValue}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  settingCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  settingTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },

  settingValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
