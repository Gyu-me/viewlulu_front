/**
 * CosmeticDetailScreen (FINAL STABLE + EDIT BUTTON)
 * --------------------------------------------------
 * - 원본 구조 유지
 * - 삭제 버튼 옆에 수정 버튼 추가
 * - 스크린리더 접근성 강화
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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

  /* ================= Android Back Handling ================= */

  useFocusEffect(
    useCallback(() => {
      if (!fromDetect) return;

      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => sub.remove();
    }, [navigation, fromDetect]),
  );

  /* ================= Fetch (단일 진입점) ================= */

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await api.get(`/cosmetics/${cosmeticId}`);
      setData(res.data);

      if (Array.isArray(res.data?.photos)) {
        res.data.photos.forEach((p: Photo) => {
          const uri = p.url || p.s3Key;
          if (uri) FastImage.preload([{ uri }]);
        });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [cosmeticId]);

  /* ================= 최초 진입 ================= */

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ================= 수정 후 복귀 시 재조회 ================= */

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  /* ================= 삭제 ================= */

  const handleDelete = () => {
    Alert.alert('삭제 확인', '이 화장품을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cosmetics/${cosmeticId}`);
            navigation.popToTop();
          } catch {
            Alert.alert('삭제 실패', '잠시 후 다시 시도해주세요.');
          }
        },
      },
    ]);
  };

  /* ================= 수정 이동 ================= */

  const handleEdit = () => {
    navigation.navigate('CosmeticEdit', {
      cosmeticId,
    });
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
        <Text style={styles.errorText}>화장품 정보를 불러올 수 없습니다.</Text>
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
          <Text
            style={styles.screenTitle}
            accessibilityRole="header"
            accessibilityLabel="화장품 정보 화면"
          >
            화장품 정보
          </Text>
        </View>

        {/* ===== 이름 + 버튼 ===== */}
        <View style={styles.nameRow}>
          <View
            style={styles.nameContainer}
            accessibilityRole="text"
            accessibilityLabel={`${data.cosmeticName}, 등록일 ${new Date(
              data.createdAt,
            ).toLocaleDateString()}`}
          >
            <Text style={styles.cosmeticName} accessible={false}>
              {data.cosmeticName}
            </Text>
            <Text style={styles.date} accessible={false}>
              등록일 · {new Date(data.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {!fromDetect && (
            <View style={styles.iconButtonGroup}>
              {/* ✏️ 수정 버튼 */}
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={handleEdit}
                accessibilityRole="button"
                accessibilityLabel="화장품 정보 수정"
                accessibilityHint="화장품 이름과 구매 날짜를 수정할 수 있습니다"
              >
                <FastImage
                  source={require('../assets/editicon.png')}
                  style={styles.icon}
                  resizeMode={FastImage.resizeMode.contain}
                  accessible={false}
                />
              </TouchableOpacity>

              {/* 🗑️ 삭제 버튼 */}
              <TouchableOpacity
                style={styles.deleteIconButton}
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="화장품 삭제"
                accessibilityHint="화장품을 내 파우치에서 삭제합니다"
              >
                <FastImage
                  source={require('../assets/deleteicon.png')}
                  style={styles.icon}
                  resizeMode={FastImage.resizeMode.contain}
                  accessible={false}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ===== 이미지 ===== */}
        <View
          style={styles.imageSection}
          accessibilityRole="text"
          accessibilityLabel={`화장품 이미지 ${data.photos.length}장`}
        >
          {data.photos.map(p => {
            const uri = p.url || p.s3Key;
            return (
              <View key={p.s3Key} style={styles.imageCard} accessible={false}>
                <FastImage
                  source={{ uri }}
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.cover}
                  accessible={false}
                />
              </View>
            );
          })}
        </View>
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

  iconButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },

  editIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary, // 🟡 노란색
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: { width: 28, height: 28, tintColor: '#000' },

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
