/**
 * HomeScreen (FINAL DEPLOY STABLE)
 * --------------------------------------------------
 * - 홈 요약 화면
 * - 하단 중앙: 화장품 인식(Detect) 버튼
 * - 화장품 등록 버튼 ❌ (MyPouch로 이동됨)
 * - ✅ Android 하드웨어 뒤로가기 → 앱 종료 확인
 *
 * ✅ 재빌드/핫리로드 후 요약 0으로 굳는 문제 방지:
 * - mount 1회 fetch(useEffect[]) 제거
 * - focus 진입 시 fetch로 통일 (MyPouch와 동일 패턴)
 * - data가 0개여도 count/over12/over24를 0으로 확정 세팅
 *
 * ✅ UI/UX 변경 없음
 * ✅ Home 화면에서만 "뷰루루" 음성 호출 활성화
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  BackHandler,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ImageBackground } from 'react-native';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { routeVoiceCommand } from '../voice/voiceCommandRouter';
import { triggerHotword } from '../voice/hotword';

/* 🔊 Hotword */
import { startHotwordListener, stopHotwordListener } from '../voice/hotword';

import PackageIcon from '../assets/packageicon.png';
import NestClockIcon from '../assets/nestclockicon.png';
import AlertIcon from '../assets/alerticon.png';
import CameraIcon from '../assets/cameraicon.png';
import HeroBanner from '../assets/배너.png';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type CosmeticItem = {
  cosmeticName: string;
  createdAt: string;
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  const [count, setCount] = useState(0);
  const [over12, setOver12] = useState(0);
  const [over24, setOver24] = useState(0);

  /* 🔥 Android 뒤로가기 → 앱 종료 */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          '앱 종료',
          '앱을 종료하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { text: '종료', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true },
        );
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  /* ================= Voice Wake Callback ================= */

  const handleVoiceWake = useCallback(() => {
    console.log('[Home] Voice Wake Triggered');

    /**
     * 🔥 여기서 "뷰루루" 호출 후 행동 정의
     * 예:
     * - TTS 안내
     * - 특정 화면 이동
     * - 음성 명령 모드 진입
     */

    Alert.alert('뷰루루 👀', '무엇을 도와드릴까요?', [{ text: '확인' }], {
      cancelable: true,
    });
  }, []);

  /* 🔊 Home 진입 시 Hotword 시작 / 이탈 시 중지 */
  useFocusEffect(
    useCallback(() => {
      startHotwordListener(handleVoiceWake);

      return () => {
        stopHotwordListener();
      };
    }, [handleVoiceWake]),
  );

  /* ✅ 포커스 진입 시 요약 데이터 로딩 (정석) */
  const fetchSummary = useCallback(async () => {
    try {
      const data: CosmeticItem[] = await getMyCosmeticsApi();

      if (!data || data.length === 0) {
        setCount(0);
        setOver12(0);
        setOver24(0);
        return;
      }

      const now = new Date();
      let c12 = 0;
      let c24 = 0;

      data.forEach(item => {
        const created = new Date(item.createdAt);
        const diffMonths =
          (now.getFullYear() - created.getFullYear()) * 12 +
          (now.getMonth() - created.getMonth());

        if (diffMonths >= 24) c24++;
        else if (diffMonths >= 12) c12++;
      });

      setCount(data.length);
      setOver12(c12);
      setOver24(c24);
    } catch {
      // UI 변경 없음
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ViewLulu</Text>

      {/* HERO */}
      <ImageBackground
        source={HeroBanner}
        style={styles.heroCard}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>나의 눈이 되어주는</Text>
          <Text style={styles.heroBrand}>뷰루루</Text>
          <Text style={styles.heroDesc}>
            화장을 등록하고{'\n'}내 화장품을 한 곳에 확인하세요!
          </Text>
        </View>
      </ImageBackground>

      {/* 얼굴 분석 버튼 */}
      <View style={styles.analysisRow}>
        <TouchableOpacity
          style={[styles.analysisBtn, styles.analysisSecondary]}
          onPress={() =>
            navigation.navigate(
              'FeatureStack' as never,
              {
                screen: 'RecentResult',
              } as never,
            )
          }
        >
          <Text style={styles.analysisTextSmall}>최근 분석</Text>
          <Text style={styles.analysisText}>결과 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.analysisBtn, styles.analysisPrimary]}
          onPress={() =>
            navigation.navigate(
              'FeatureStack' as never,
              {
                screen: 'FaceAnalysis',
              } as never,
            )
          }
        >
          <Text style={styles.analysisTextSmall}>AI 얼굴형</Text>
          <Text style={styles.analysisText}>분석하기</Text>
        </TouchableOpacity>
      </View>

      {/* 파우치 요약 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>내 파우치</Text>

        <View style={styles.summaryRow}>
          <SummaryItem
            label="전체"
            value={count}
            icon={PackageIcon}
            iconColor={colors.primary}
          />
          <SummaryItem
            label="12개월"
            value={over12}
            icon={NestClockIcon}
            iconColor="#FF9F0A"
          />
          <SummaryItem
            label="24개월"
            value={over24}
            icon={AlertIcon}
            iconColor="#FF453A"
          />
        </View>
      </View>

      {/* 하단 Detect */}
      <View style={styles.fabGlow}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate('CaptureStack', {
              screen: 'CosmeticDetect',
            } as never)
          }
        >
          <Image source={CameraIcon} style={styles.fabIcon} />
        </TouchableOpacity>
      </View>
      {/* 🔥 [TEST ONLY] 음성 호출 강제 트리거 */}
      <TouchableOpacity
        onPress={() => triggerHotword()}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: 10,
          backgroundColor: 'rgba(255,212,0,0.9)',
          borderRadius: 8,
          zIndex: 999,
        }}
      >
        <Text style={{ fontWeight: '800' }}>뷰루루 테스트</Text>
      </TouchableOpacity>
    </View>
  );
}

/*====================================*/
/* 요약 아이템 */
const SummaryItem = ({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: number;
  icon: any;
  iconColor: string;
}) => (
  <View style={styles.summaryItem}>
    <Image
      source={icon}
      style={[styles.summaryIcon, { tintColor: iconColor }]}
    />
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

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
    fontWeight: '800',
    marginBottom: 24,
  },

  heroCard: {
    height: 240,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover', // 🔥 필수
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    top: 30, // 🔥 핵심
    left: 20,
    right: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',

    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroBrand: {
    color: colors.primary, // 노란색 강조
    fontSize: 32, // 🔥 크게
    fontWeight: '900',

    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,

    marginTop: 2,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
  },

  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 28,
    padding: 24,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  summaryIcon: {
    width: 26,
    height: 26,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },

  fabGlow: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,212,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  analysisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  analysisBtn: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',

    borderWidth: 1.5,
    borderColor: '#FFD400',

    // 🔥 노란색 그림자
    shadowColor: '#FFD400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,

    elevation: 6,
  },

  analysisPrimary: {
    backgroundColor: '#FFD400',
  },

  analysisSecondary: {
    backgroundColor: '#1A1A1A',
  },

  analysisTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    opacity: 0.7,
  },

  analysisText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});
