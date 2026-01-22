/**
 * CosmeticDetailScreen (FINAL STABLE)
 * --------------------------------------------------
 * - 시각장애인을 위한 고대비 디자인
 * - Detect 진입 시 뒤로가기 → 인식 결과로 복귀
 * - Android 앱 종료 완전 방지
 * - TabBar 숨김/복구 안정화
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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

  /* ================= TabBar 숨김 ================= */
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [navigation])
  );

  /* ================= Android Back Handling (FINAL FIX) ================= */
  useFocusEffect(
    useCallback(() => {
      if (!fromDetect) return;

      const onBackPress = () => {
        // 🔥 goBack 쓰지 말 것 (이미 stack이 없음)
        navigation.navigate('CosmeticDetail', {
          cosmeticId,
          fromDetect: true,
        });


        return true; // ✅ 앱 종료 완전 차단
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => {
        subscription.remove();
      };
    }, [navigation, fromDetect, cosmeticId])
  );


  /* ================= Fetch ================= */
  useEffect(() => {
    let alive = true;

    const fetchDetail = async () => {
      try {
        const res = await api.get(`/cosmetics/${cosmeticId}`);
        if (alive) setData(res.data);
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

  /* ================= 삭제 핸들러 ================= */
  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 화장품을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cosmetics/${cosmeticId}`);

            Alert.alert('삭제 완료', '', [
              {
                text: '확인',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: 'MainTabs',
                        state: {
                          routes: [{ name: 'MyPouchTab' }], // ✅ 수정
                        },
                      },
                    ],
                  });
                },
              },
            ]);
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

        {/* ===== 화장품명 + 삭제 ===== */}
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
              <Image
                source={require('../assets/deleteicon.png')}
                style={styles.deleteIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ===== 이미지 ===== */}
        <View style={styles.imageSection}>
          {data.photos.map((p, idx) => (
            <View key={idx} style={styles.imageCard}>
              <Image source={{ uri: p.url || p.s3Key }} style={styles.image} />
            </View>
          ))}
        </View>

        {/* ===== Detect 진입 액션 ===== */}
        {fromDetect && (
          <View style={styles.detectActionsRow}>
            <TouchableOpacity
              style={styles.detectActionButton}
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'MainTabs',
                      state: { routes: [{ name: 'MyPouchTab' }] },
                    },
                  ],
                })
              }
            >
              <Text style={styles.detectActionText}>내 파우치로</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detectActionButton}
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'MainTabs',
                      state: { routes: [{ name: 'HomeTab' }] },
                    },
                  ],
                })
              }
            >
              <Text style={styles.detectActionText}>홈으로</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= Styles ================= */

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

  detectActionsRow: {
    marginTop: 32,
    flexDirection: 'row',
    gap: 14,
  },
  detectActionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  detectActionText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
});
