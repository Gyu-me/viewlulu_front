/**
 * MyPouchScreen (API 연동 최종본)
 * --------------------------------------------------
 * - 서버에서 내 화장품 목록 조회
 * - 기존 네비게이션 흐름 유지
 * - 에러/로딩 처리 포함
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { getMyCosmeticsApi, Cosmetic } from '../api/cosmetic.api';
import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';

type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

export default function MyPouchScreen() {
  const navigation = useNavigation<Nav>();

  const [items, setItems] = useState<Cosmetic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCosmetics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyCosmeticsApi();
      setItems(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? '화장품 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCosmetics();
  }, []);

  const goDetect = () => {
    navigation.navigate('CosmeticDetect');
  };

  const renderItem = ({ item }: { item: Cosmetic }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('CosmeticDetail', { id: String(item.id) })
      }
    >
      <Text style={styles.cardTitle}>등록된 화장품</Text>
      <Text style={styles.cardSub}>
        등록일: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMyCosmetics}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 파우치</Text>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>등록된 화장품이 없습니다.</Text>
        }
      />

      <TouchableOpacity style={styles.detectButton} onPress={goDetect}>
        <Text style={styles.detectText}>화장품 인식하기</Text>
      </TouchableOpacity>
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
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  cardSub: {
    color: '#ccc',
    fontSize: 14,
  },

  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },

  detectButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 36,
  },

  detectText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },

  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: colors.primary,
    marginTop: 12,
  },

  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 16,
  },

  retryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },

  retryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
