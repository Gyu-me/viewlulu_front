/**
 * HomeScreen
 * --------------------------------------------------
 * 앱의 유일한 "홈" 화면
 *
 * 역할:
 * - 음성 명령 UI 제공
 * - 기능 진입 버튼 제공
 * - 최근 분석 결과 요약 표시
 *
 * ⚠️ 중요 설계 원칙:
 * - HomeScreen은 기능 화면을 직접 소유하지 않는다.
 * - 모든 기능(분석/등록)은 RootNavigator의 FeatureStack으로 이동한다.
 * - 따라서 여기서는 반드시
 *   navigation.navigate('Feature', { screen: '...' }) 형태만 사용한다.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const RECENT_RESULTS = [
  { id: '1', title: '피부 분석', desc: '이마 여드름 감지' },
  { id: '2', title: '얼굴형 분석', desc: '계란형 / 둥근형' },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [listening, setListening] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈</Text>

      {/* 🎤 음성 명령 */}
      <TouchableOpacity
        style={styles.voiceBox}
        activeOpacity={0.8}
        onPress={() => setListening(true)}
      >
        <Text style={styles.mic}>🎤</Text>
        <Text style={styles.voiceText}>말해서 물어보세요</Text>
      </TouchableOpacity>

      {/* 음성 오버레이 */}
      <Modal visible={listening} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.voiceModal}>
            <Text style={styles.micBig}>🎤</Text>
            <Text style={styles.listenTitle}>듣고 있어요</Text>
            <Text style={styles.listenDesc}>
              말씀을 마치면{'\n'}
              자동으로 종료됩니다
            </Text>

            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => setListening(false)}
            >
              <Text style={styles.stopText}>종료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        <ActionButton
          label="얼굴형 분석"
          onPress={() =>
            navigation.navigate('Feature', {
              screen: 'FaceAnalysis',
            })
          }
        />
        <ActionButton
          label="피부 분석"
          onPress={() =>
            navigation.navigate('Feature', {
              screen: 'SkinAnalysis',
            })
          }
        />
      </View>

      {/* 최근 분석 결과 */}
      <TouchableOpacity
        style={styles.resultCard}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('Feature', {
            screen: 'RecentResult',
          })
        }
      >
        <Text style={styles.resultTitle}>최근 분석 결과</Text>
        <Text style={styles.resultLink}>탭하여 자세히 보기 →</Text>
      </TouchableOpacity>

      {/* 요약 리스트 */}
      <View style={styles.resultList}>
        {RECENT_RESULTS.map((item) => (
          <View key={item.id} style={styles.resultItem}>
            <Text style={styles.resultItemTitle}>{item.title}</Text>
            <Text style={styles.resultItemDesc}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* 하위 버튼 컴포넌트 */
const ActionButton = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={onPress}>
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
    marginBottom: 24,
  },
  voiceBox: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: 'center',
    marginBottom: 28,
  },
  mic: { fontSize: 42, marginBottom: 10 },
  voiceText: { color: '#000', fontSize: 22, fontWeight: 'bold' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModal: {
    width: '80%',
    backgroundColor: '#000',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  micBig: { fontSize: 64, marginBottom: 20 },
  listenTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listenDesc: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  stopBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 14,
  },
  stopText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    width: '30%',
    alignItems: 'center',
  },
  actionText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  resultCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  resultTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  resultLink: {
    color: colors.primary,
    fontSize: 13,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  resultList: { marginTop: 8 },
  resultItem: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultItemTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultItemDesc: { color: '#fff', fontSize: 13 },
});
