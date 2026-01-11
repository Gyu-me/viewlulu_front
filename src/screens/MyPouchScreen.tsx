/**
 * MyPouchScreen (최종본 + 📷 카메라 FAB)
 * --------------------------------------------------
 * - GET /cosmetics/me
 * - 썸네일 / 화장품 이름 / 등록일 표시
 * - 하단 중앙 카메라 버튼 → CosmeticDetect 이동
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi } from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';

type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

type MyPouchItem = {
  groupId: number;
  cosmeticName: string;
  createdAt: string;
  thumbnailUrl: string | null;
};

const S3_BASE_URL = 'https://viewlulus3.s3.ap-northeast-2.amazonaws.com';
const CameraIcon = require('../assets/cameraicon.png');

export default function MyPouchScreen() {
  const navigation = useNavigation<Nav>();

  const [items, setItems] = useState<MyPouchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchMyCosmetics();
  }, []);

  const goDetail = (groupId: number) => {
    navigation.navigate('CosmeticDetail', { cosmeticId: groupId });
  };

  const goDetect = () => {
    navigation.navigate('CosmeticDetect');
  };

  /* ================= 로딩 / 에러 ================= */

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

  /* ================= 화면 ================= */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 파우치</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.groupId)}
        contentContainerStyle={{ paddingBottom: 140 }} // FAB 공간 확보
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => goDetail(item.groupId)}
          >
            <View style={styles.thumbWrap}>
              {item.thumbnailUrl ? (
                <Image
                  source={{ uri: `${S3_BASE_URL}/${item.thumbnailUrl}` }}
                  style={styles.thumb}
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
                등록일: {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 🌟 노란 글로우 링 */}
      <View style={styles.fabGlow}>
        {/* 📷 실제 버튼 */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={goDetect}
        >
          <Image source={CameraIcon} style={styles.fabIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },

  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
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

  /* ================= FAB Glow ================= */

  fabGlow: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',

    width: 80,
    height: 80,
    borderRadius: 40,

    backgroundColor: 'rgba(255, 212, 0, 0.25)',
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

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,

    elevation: 10,
  },

  fabIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});