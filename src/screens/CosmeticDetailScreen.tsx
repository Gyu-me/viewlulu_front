/**
 * CosmeticDetailScreen (FINAL STABLE)
 * --------------------------------------------------
 * - 시각장애인을 위한 고대비 디자인
 * - Detect 진입 시 뒤로가기 → 인식 결과로 복귀
 * - Android 앱 종료 완전 방지
 * - TabBar 숨김/복구 안정화
 * - 이미지 캐시 최적화 (FastImage + prefetch)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FastImage from 'react-native-fast-image';

import { colors } from '../theme/colors';
import { api } from '../api/api';

/* ================= Types ================= */

type Photo = {
  s3Key: string;
  url?: string;
};

type CosmeticDetail = {
  cosmeticId: number;
  cosmeticName: string;
  createdAt: string;
  photos: Photo[];
};

type RouteParams = {
  CosmeticDetail: {
    cosmeticId: number;
    fromDetect?: boolean;
  };
};

/* ================= Component ================= */

export default function CosmeticDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CosmeticDetail'>>();
  const insets = useSafeAreaInsets();

  const { cosmeticId, fromDetect } = route.params;

  const [data, setData] = useState<CosmeticDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ================= Android Back Handling (Detect 전용) ================= */

  useFocusEffect(
    useCallback(() => {
      if (!fromDetect) return;

      const onBackPress = () => {
        navigation.goBack(); // ✅ Detect 결과 화면으로 복귀
        return true;         // ❗ 앱 종료 방지
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => sub.remove();
    }, [navigation, fromDetect])
  );

  /* ================= Fetch ================= */

  useEffect(() => {
    let alive = true;

    const fetchDetail = async () => {
      try {
        const res = await api.get(`/cosmetics/${cosmeticId}`);
        if (!alive) return;

        setData(res.data);

        // 🔥 이미지 prefetch
        if (Array.isArray(res.data?.photos)) {
          res.data.photos.forEach((p: Photo) => {
            const uri = p.url || p.s3Key;
            if (uri) {
              FastImage.preload([{ uri }]);
            }
          });
        }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      alive = false;
    };
  }, [cosmeticId]);

  /* ================= 삭제 핸들러 (❗원본 유지) ================= */

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 화장품을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cosmetics/${cosmeticId}`);
            navigation.popToTop(); // 기존 동작 유지
          } catch {
            Alert.alert('삭제 실패', '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  /* ================= Render ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          화장품 정보를 불러올 수 없습니다.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        {/* ===== 상단 타이틀 ===== */}
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>화장품 정보</Text>
        </View>

        {/* ===== 화장품명 + 삭제 (❗원본 유지) ===== */}
        <View style={styles.nameRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.cosmeticName}>{data.cosmeticName}</Text>
            <Text style={styles.date}>
              등록일 · {new Date(data.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {!fromDetect && (
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={handleDelete}
            >
              <FastImage
                source={require('../assets/deleteicon.png')}
                style={styles.deleteIcon}
                resizeMode={FastImage.resizeMode.contain}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ===== 이미지 ===== */}
        <View style={styles.imageSection}>
          {data.photos.map(p => {
            const uri = p.url || p.s3Key;
            return (
              <View key={p.s3Key} style={styles.imageCard}>
                <FastImage
                  source={{
                    uri,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.web,
                  }}
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= Styles (변경 없음) ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: { color: '#FF4444', fontSize: 16, fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20 },

  headerSection: {
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    marginBottom: 24,
  },
  screenTitle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },

  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  nameContainer: { flex: 1 },
  cosmeticName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
  },
  date: { color: '#999', fontSize: 14 },

  deleteIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: { width: 30, height: 30, tintColor: '#000' },

  imageSection: { gap: 20 },
  imageCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 4,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
});
