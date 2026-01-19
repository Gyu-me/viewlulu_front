/**
 * HomeScreen (FINAL)
 * --------------------------------------------------
 * - 홈 요약 화면
 * - 하단 중앙: 화장품 인식(Detect) 버튼
 * - 화장품 등록 버튼 ❌ (MyPouch로 이동됨)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { RootStackParamList } from '../navigation/RootNavigator';

import PackageIcon from '../assets/packageicon.png';
import NestClockIcon from '../assets/nestclockicon.png';
import AlertIcon from '../assets/alerticon.png';
import CameraIcon from '../assets/cameraicon.png';

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

  /* 요약 데이터 로딩 */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data: CosmeticItem[] = await getMyCosmeticsApi();
        if (data.length === 0) return;

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
      } catch {}
    };

    fetchSummary();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ViewLulu</Text>

      {/* HERO */}
      <View style={styles.heroCard}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>내 화장품을 한 곳에</Text>
          <Text style={styles.heroDesc}>
            유통기한과 개봉일을 관리하고{'\n'}
            안전하게 사용하세요
          </Text>
        </View>
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

      {/* 🔥 홈 하단 – 화장품 인식 버튼 */}
      <View style={styles.fabGlow}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate('MyPouch', {
              screen: 'CosmeticDetect',
            })
          }
        >

          <Image source={CameraIcon} style={styles.fabIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    height: 220,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
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
});
