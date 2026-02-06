/**
 * MyPouchScreen (FINAL DEPLOY STABLE)
 * --------------------------------------------------
 * - 화장품 목록 조회
 * - ✅ 등록 버튼: 상단 큰 버튼 ❌ → 우하단 FAB(+) ✅
 * - ✅ 상단: 필터 칩(버튼)만 유지
 *
 * ✅ Hook 순서 안전
 * ✅ CaptureStack 복귀 후 안정적 갱신
 * ✅ 저장 실패 시 기존 목록 유지
 * ✅ 중복 fetch 완전 차단
 * ✅ 이미지 캐시 최적화 (FastImage 적용)
 *
 * ♿ 접근성 강화
 * - 화면 제목(header) 명확화
 * - 필터 영역/상태(selected) 읽힘
 * - 목록(list) / 항목(button) 라벨/힌트 명확화
 * - FAB 등록 버튼: 항상 접근 가능, 목적/영역 안내
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
import { Image } from 'react-native';

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

    if (filter === 'OVER_6') return diffMonths >= 6 && diffMonths < 12;
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
      <View style={styles.center} accessibilityLabel="내 파우치 로딩 중">
        <ActivityIndicator color={colors.primary} size="large" />
        <Text
          style={{ color: colors.primary, marginTop: 12 }}
          accessibilityRole="text"
        >
          목록을 불러오는 중입니다.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} accessibilityLabel="내 파우치 오류 화면">
        <Text style={styles.errorText} accessibilityRole="text">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityLabel="내 파우치 화면">
      {/* ===== 상단 타이틀 ===== */}
      <Text
        style={styles.title}
        accessibilityRole="header"
        accessibilityLabel="내 파우치"
      >
        내 파우치
      </Text>

      {/* ===== 상단 기간 필터 ===== */}
      <View accessibilityRole="tablist" accessibilityLabel="기간 필터">
        <View style={styles.tabRow}>
          <FilterTab
            label="전체"
            active={filter === 'ALL'}
            onPress={() => setFilter('ALL')}
            a11yLabel="전체 화장품"
            a11yHint="모든 화장품을 표시합니다"
          />
          <FilterTab
            label="6개월 이상"
            active={filter === 'OVER_6'}
            onPress={() => setFilter('OVER_6')}
            a11yLabel="등록 후 6개월 이상 12개월 미만 화장품"
            a11yHint="등록 후 6개월 이상 지난 화장품만 표시합니다"
          />
          <FilterTab
            label="12개월 이상"
            active={filter === 'OVER_12'}
            onPress={() => setFilter('OVER_12')}
            a11yLabel="등록 후 12개월 이상 화장품"
            a11yHint="등록 후 12개월 이상 지난 화장품만 표시합니다"
          />
        </View>

        <View style={styles.tabDivider} />
      </View>

      {/* ===== 목록 ===== */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => String(item.groupId)}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const uri = toImageUrl(item.thumbnailUrl);
          const dateText = new Date(item.createdAt).toLocaleDateString();

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => goDetail(item.groupId)}
              accessibilityRole="button"
              accessibilityLabel={`목록 항목 ${index + 1}. ${
                item.cosmeticName
              }. 등록일 ${dateText}.`}
              accessibilityHint="두 번 탭하면 화장품 상세 정보로 이동합니다"
            >
              <View style={styles.thumbWrap} accessible={false}>
                {uri ? (
                  <FastImage
                    source={{ uri, priority: FastImage.priority.normal }}
                    style={styles.thumb}
                    resizeMode={FastImage.resizeMode.cover}
                    accessibilityIgnoresInvertColors={false}
                  />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Text style={styles.thumbFallbackText}>No Image</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo} accessible={false}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.cosmeticName}
                </Text>
                <Text style={styles.cardSub}>등록일 · {dateText}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        accessibilityRole="list"
        accessibilityLabel="화장품 목록"
        accessibilityHint="아래로 스크롤하여 목록을 탐색할 수 있습니다"
        ListEmptyComponent={
          <View
            style={styles.emptyWrap}
            accessibilityLabel="목록이 비어 있습니다"
            accessibilityHint="화장품 등록 버튼을 눌러 새 화장품을 등록할 수 있습니다"
          >
            <Text style={styles.emptyTitle} accessibilityRole="text">
              표시할 화장품이 없습니다.
            </Text>
            <Text style={styles.emptyDesc} accessibilityRole="text">
              우하단의 등록 버튼을 눌러 화장품을 추가해보세요.
            </Text>
          </View>
        }
      />

      {/* ===== FAB: 화장품 등록 ===== */}
      <View style={styles.fabGlow} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={goRegister}
          accessibilityRole="button"
          accessibilityLabel="화장품 등록 버튼"
          accessibilityHint="카메라로 새로운 화장품을 등록합니다"
        >
          <Image
            source={require('../assets/add_photo.png')}
            style={styles.fabCameraImage}
            resizeMode="contain"
            accessible={false}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= 필터 칩 버튼 ================= */

const FilterTab = ({
  label,
  active,
  onPress,
  a11yLabel,
  a11yHint,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  a11yLabel: string;
  a11yHint?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.tabItem}
    accessibilityRole="tab"
    accessibilityLabel={a11yLabel}
    accessibilityState={{ selected: active }}
    accessibilityHint={
      a11yHint ?? '이 기간 기준으로 화장품 목록을 필터링합니다'
    }
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {label}
    </Text>

    {active && <View style={styles.tabIndicator} />}
  </TouchableOpacity>
);

const filterToKorean = (f: PouchFilter) => {
  if (f === 'ALL') return '전체';
  if (f === 'OVER_6') return '6개월 이상';
  if (f === 'OVER_12') return '12개월 이상';
  return '전체';
};

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
    marginBottom: 14,
  },

  /* ===== 필터 섹션 ===== */
  filterSection: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  filterTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterStatus: {
    color: '#BDBDBD',
    fontSize: 13,
  },

  /* ===== 필터 버튼 ===== */
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },

  tabItem: {
    alignItems: 'center',
    paddingVertical: 12,
    flex: 1,
  },

  tabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  tabIndicator: {
    marginTop: 6,
    height: 3,
    width: '60%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  tabDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: '#333', // 아래 콘텐츠와 구분용 직선
  },

  /* ===== 카드 ===== */
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

  /* ===== 빈 목록 ===== */
  emptyWrap: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 18,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#BDBDBD',
    fontSize: 14,
    lineHeight: 20,
  },

  /* ===== 로딩/에러 ===== */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff6b6b',
  },

  /* ===== FAB ===== */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,

    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,

    justifyContent: 'center',
    alignItems: 'center',

    // 🔥 원형 버튼 뒤 그림자 (이게 핵심)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,

    elevation: 16,
  },

  fabIcon: {
    color: '#000',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
    marginBottom: 2,
  },
  fabText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -2,
  },

  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
});
