/**
 * SettingsScreen (최종본)
 * --------------------------------------------------
 * - 앱 설정 화면
 * - MyPouchScreen / HomeScreen 과 동일한 상단 시작 기준
 * - "접근성" 섹션 시작 위치 완전 통일
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { triggerVibration } from '../utils/haptic';

export default function SettingsScreen() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState<0 | 1 | 2>(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ✅ 상단 타이틀 (MyPouch와 동일 기준) */}
      <Text style={styles.title}>설정</Text>

      {/* ================= 접근성 ================= */}
      <Text style={styles.sectionTitle}>접근성</Text>

      {/* 진동 피드백 */}
      <TouchableOpacity
        style={styles.settingCard}
        activeOpacity={0.8}
        onPress={() => {
          const next = !vibrationEnabled;
          setVibrationEnabled(next);
          if (next) triggerVibration();
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>진동 피드백</Text>
          <Text style={styles.settingDesc}>
            버튼 클릭 시 진동으로 알려줍니다.
          </Text>
        </View>

        <Text style={styles.settingValue}>
          {vibrationEnabled ? 'ON' : 'OFF'}
        </Text>
      </TouchableOpacity>

      {/* 음성 안내 속도 */}
      <View style={styles.settingCardColumn}>
        <Text style={styles.settingTitle}>음성 안내 속도</Text>
        <Text style={styles.settingDesc}>
          음성 안내의 말하는 속도를 조절합니다.
        </Text>

        <View style={styles.segmentBar}>
          {['느리게', '보통', '빠르게'].map((label, index) => {
            const active = voiceSpeed === index;

            return (
              <TouchableOpacity
                key={label}
                style={[
                  styles.segmentItem,
                  active && styles.segmentItemActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setVoiceSpeed(index as 0 | 1 | 2)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
      paddingHorizontal: 20,
      paddingTop: 48,
    },



  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  settingCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingCardColumn: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },

  settingTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  settingDesc: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 12,
  },

  settingValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* 음성 속도 세그먼트 */
  segmentBar: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
  },

  segmentItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#000',
  },

  segmentItemActive: {
    backgroundColor: colors.primary,
  },

  segmentText: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  segmentTextActive: {
    color: '#000',
  },
});
