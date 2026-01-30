/**
 * MyPouchScreen (FINAL DEPLOY STABLE)
 * --------------------------------------------------
 * - 화장품 목록 조회
 * - 상단: 화장품 등록 버튼
 *
 * ✅ Hook 순서 안전
 * ✅ CaptureStack 복귀 후 안정적 갱신
 * ✅ 저장 실패 시 기존 목록 유지
 * ✅ 중복 fetch 완전 차단
 * ✅ 이미지 캐시 최적화 (FastImage 적용)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import FastImage from 'react-native-fast-image';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';

type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

/* ================= 추가: 필터 타입 ================= */
type PouchFilter = 'ALL' | 'OVER_6' | 'OVER_12';

type MyPouchItem = {
  groupId: number;
  cosmeticName: string;
  createdAt: string;
  thumbnailUrl: string | null;
};

/* ================= S3 썸네일 처리 ================= */

const S3_BASE_URL = 'https://viewlulus3.s3.ap-northeast-2.amazonaws.com';

const toImageUrl = (keyOrUrl?: string | null) => {
  if (!keyOrUrl) return null;
  if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
  const clean = keyOrUrl.replace(/^\//, '');
  return `${S3_BASE_URL.replace(/\/$/, '')}/${encodeURI(clean)}`;
};

export default function MyPouchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();

  const initialFilter: PouchFilter = route.params?.filter ?? 'ALL';

  const [items, setItems] = useState<MyPouchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PouchFilter>(initialFilter);

  // 🔒 중복 fetch 방지
  const fetchingRef = useRef(false);

  // Home → 파우치 요약 아이템 클릭 → MyPouch 진입 시 해당 필터 버튼이 “선택된 상태”로 보이게
  useEffect(() => {
    if (route.params?.filter) {
      setFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  /* ================= Android 뒤로가기 → Home ================= */

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.getParent()?.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                index: 0,
                routes: [{ name: 'HomeTab' }],
              },
            },
          ],
        });
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => sub.remove();
    }, [navigation]),
  );

  /* ================= 목록 조회 (단일 진입점) ================= */

  const fetchMyCosmetics = async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await getMyCosmeticsApi();

      const normalized: MyPouchItem[] = data.map((item: any) => ({
        groupId: item.groupId,
        cosmeticName: item.cosmeticName,
        createdAt: item.createdAt,
        thumbnailUrl: item.thumbnailUrl ?? null,
      }));

      setItems(normalized);
    } catch {
      setError('화장품 목록을 불러오지 못했습니다.');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  /* ================= 화면 진입 / 복귀 시 ================= */

  useFocusEffect(
    useCallback(() => {
      fetchMyCosmetics();
    }, []),
  );

  /* ================= 기간 필터링 ================= */

  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;

    const created = new Date(item.createdAt);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());

    if (filter === 'OVER_6') return diffMonths >= 6;
    if (filter === 'OVER_12') return diffMonths >= 12;

    return true;
  });

  /* ================= 네비게이션 ================= */

  const goDetail = (groupId: number) => {
    navigation.navigate('CosmeticDetail', {
      cosmeticId: groupId,
    });
  };

  const goRegister = () => {
    navigation.navigate(
      'CaptureStack' as never,
      {
        screen: 'CosmeticRegister',
      } as never,
    );
  };

  /* ================= Render ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 파우치</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.9}
        onPress={goRegister}
      >
        <Text style={styles.primaryButtonText}>화장품 등록</Text>
      </TouchableOpacity>

      {/* ===== 필터 버튼 ===== */}
      <View style={styles.filterRow}>
        <FilterButton
          label="전체"
          active={filter === 'ALL'}
          onPress={() => setFilter('ALL')}
        />
        <FilterButton
          label="6개월 이상"
          active={filter === 'OVER_6'}
          onPress={() => setFilter('OVER_6')}
        />
        <FilterButton
          label="12개월 이상"
          active={filter === 'OVER_12'}
          onPress={() => setFilter('OVER_12')}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => String(item.groupId)}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const uri = toImageUrl(item.thumbnailUrl);

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => goDetail(item.groupId)}
            >
              <View style={styles.thumbWrap}>
                {uri ? (
                  <FastImage
                    source={{
                      uri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={styles.thumb}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Text style={styles.thumbFallbackText}>No Image</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.cosmeticName}
                </Text>
                <Text style={styles.cardSub}>
                  등록일 · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

/* ================= 필터 버튼 ================= */

const FilterButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.filterButton, active && styles.filterButtonActive]}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ================= Styles ================= */

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
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.primary,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#000',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },

  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbFallbackText: {
    color: '#666',
    fontSize: 12,
  },

  cardInfo: { flex: 1 },
  cardTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSub: {
    color: '#ccc',
    fontSize: 14,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
  },
});
