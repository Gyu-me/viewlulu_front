/**
 * MyPouchScreen (FINAL DEPLOY STABLE)
 * --------------------------------------------------
 * - 화장품 목록 조회
 * - 상단: 화장품 등록 버튼
 * - 하단 카메라 버튼 ❌ 제거
 *
 * ✅ Hook 순서 안전
 * ✅ 등록/수정/삭제 후 자동 갱신
 * ✅ 기존 API / UX 유지
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';
import { BackHandler } from 'react-native';

type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

type MyPouchItem = {
  groupId: number;
  cosmeticName: string;
  createdAt: string;
  thumbnailUrl: string | null;
};



/* S3 썸네일 처리 */
const S3_BASE_URL =
  'https://viewlulus3.s3.ap-northeast-2.amazonaws.com';

const toImageUrl = (keyOrUrl?: string | null) => {
  if (!keyOrUrl) return null;
  if (/^https?:\/\//i.test(keyOrUrl)) return keyOrUrl;
  const clean = keyOrUrl.replace(/^\//, '');
  return `${S3_BASE_URL.replace(/\/$/, '')}/${encodeURI(clean)}`;
};

export default function MyPouchScreen() {
  const navigation = useNavigation<Nav>();

  // 🔹 Hook 순서 고정 (절대 변경 금지)
  const [items, setItems] = useState<MyPouchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 /* 🔥 Android 뒤로가기 → Home으로 이동 */
 useFocusEffect(
   useCallback(() => {
     const onBackPress = () => {
       navigation.navigate('Home');
       return true; // 기본 앱 종료 차단
     };

     const subscription = BackHandler.addEventListener(
       'hardwareBackPress',
       onBackPress
     );

     return () => {
       subscription.remove();
     };
   }, [navigation])
 );


  /* 화장품 목록 요청 */
  const fetchMyCosmetics = async () => {
    try {
      setLoading(true);
      setError(null);

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
      setLoading(false);
    }
  };

  /* 최초 1회 */
  useEffect(() => {
    fetchMyCosmetics();
  }, []);

  /* 포커스 복귀 시 자동 갱신 */
  useFocusEffect(
    useCallback(() => {
      fetchMyCosmetics();
    }, [])
  );

  /* 상세 이동 */
  const goDetail = (groupId: number) => {
    navigation.navigate('CosmeticDetail', {
      cosmeticId: groupId,
    });
  };

  /* 🔥 화장품 등록 이동 */
  const goRegister = () => {
    navigation.navigate('CosmeticRegister');
  };

  /* 로딩 */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  /* 에러 */
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 타이틀 */}
      <Text style={styles.title}>내 파우치</Text>

      {/* 🔥 상단 화장품 등록 버튼 */}
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.9}
        onPress={goRegister}
      >
        <Text style={styles.primaryButtonText}>
          화장품 등록
        </Text>
      </TouchableOpacity>

      {/* 목록 */}
      <FlatList
        data={items}
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
                  <Image source={{ uri }} style={styles.thumb} />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Text style={styles.thumbFallbackText}>
                      No Image
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <Text
                  style={styles.cardTitle}
                  numberOfLines={1}
                >
                  {item.cosmeticName}
                </Text>
                <Text style={styles.cardSub}>
                  등록일:{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

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

  /* 🔥 등록 버튼 */
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* 카드 */
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
  thumb: {
    width: '100%',
    height: '100%',
  },
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

  cardInfo: {
    flex: 1,
  },
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
