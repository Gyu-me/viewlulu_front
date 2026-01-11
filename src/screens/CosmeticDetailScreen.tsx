/**
 * CosmeticDetailScreen (Hook 안전 + UI 통일 최종본)
 * --------------------------------------------------
 * - GET /cosmetics/:id
 * - 블랙 배경
 * - 제품명: 노란색
 * - 등록일: 흰색
 * - 상단 네비게이터 back 버튼만 사용
 * - 하단 삭제 기능 추가
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../theme/colors';

const API_BASE_URL = 'https://api.viewlulu.site';
const S3_BASE_URL = 'https://viewlulus3.s3.ap-northeast-2.amazonaws.com';

/* ================= 타입 ================= */

type Photo = {
  s3Key: string;
  originalName: string;
  mimeType: string;
};

type CosmeticDetail = {
  cosmeticId: number;
  cosmeticName: string;
  createdAt: string;
  photos: Photo[];
};

type RouteParams = {
  CosmeticDetail: { cosmeticId: number };
};

/* ================= 화면 ================= */

export default function CosmeticDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CosmeticDetail'>>();
  const { cosmeticId } = route.params;

  const [data, setData] = useState<CosmeticDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ================= 데이터 조회 ================= */

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const res = await axios.get<CosmeticDetail>(
          `${API_BASE_URL}/cosmetics/${cosmeticId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [cosmeticId]);

  /* ================= 삭제 ================= */

  const handleDelete = () => {
    Alert.alert(
      '삭제 확인',
      '이 화장품을 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              await axios.delete(
                `${API_BASE_URL}/cosmetics/${cosmeticId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              Alert.alert('삭제 완료', '화장품이 삭제되었습니다.');
              navigation.goBack();
            } catch {
              Alert.alert('삭제 실패', '삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  /* ================= 상태 처리 ================= */

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
          화장품 정보를 불러오는 중 오류가 발생했습니다.
        </Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.container}>
      {/* 제품명 */}
      <Text style={styles.name}>{data.cosmeticName}</Text>

      {/* 등록일 */}
      <Text style={styles.date}>
        등록일: {new Date(data.createdAt).toLocaleString()}
      </Text>

      {/* 이미지 */}
      {data.photos.map((photo, index) => (
        <Image
          key={`${data.cosmeticId}-${index}`}
          source={{ uri: `${S3_BASE_URL}/${photo.s3Key}` }}
          style={styles.image}
        />
      ))}

      {/* 삭제 버튼 */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>화장품 삭제하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  name: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },

  date: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
  },

  image: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#111',
  },

  deleteButton: {
    borderWidth: 2,
    borderColor: '#ff4d4f',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },

  deleteText: {
    color: '#ff4d4f',
    fontSize: 16,
    fontWeight: '700',
  },

  errorText: {
    color: '#ff6b6b',
    fontSize: 15,
  },
});
