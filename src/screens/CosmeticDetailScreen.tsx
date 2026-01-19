/**
 * CosmeticDetailScreen (FINAL + Detect UX 분기)
 * --------------------------------------------------
 * - GET /cosmetics/:id
 * - api.ts 사용 (Authorization 자동)
 * - Detect 결과 진입 시 UX 분기 처리
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    fromDetect?: boolean; // ✅ Detect 진입 여부
  };
};

/* ================= Component ================= */

export default function CosmeticDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CosmeticDetail'>>();
  const { cosmeticId, fromDetect } = route.params;

  const [data, setData] = useState<CosmeticDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ================= Fetch ================= */

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/cosmetics/${cosmeticId}`);
        setData(res.data);
      } catch (e) {
        console.error('[CosmeticDetailScreen] fetch error', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [cosmeticId]);

  /* ================= Delete ================= */

  const handleDelete = () => {
    Alert.alert(
      '삭제 확인',
      '이 화장품을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/cosmetics/${cosmeticId}`);
              Alert.alert('삭제 완료');
              navigation.goBack();
            } catch {
              Alert.alert('삭제 실패');
            }
          },
        },
      ]
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
     <SafeAreaView
       edges={['top', 'bottom']}
       style={{ flex: 1, backgroundColor: '#000' }}
     >
       <ScrollView
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false}
       >
         <Text style={styles.name}>{data.cosmeticName}</Text>

         <Text style={styles.date}>
           등록일: {new Date(data.createdAt).toLocaleString()}
         </Text>

         {data.photos.map((p, idx) => {
           const uri = p.url || p.s3Key;
           return (
             <Image
               key={idx}
               source={{ uri }}
               style={styles.image}
               resizeMode="cover"
             />
           );
         })}

         {/* ================= 하단 액션 분기 ================= */}
         {fromDetect ? (
           <View style={styles.detectActions}>
             <TouchableOpacity
               style={styles.secondaryButton}
               onPress={() => navigation.popToTop()}
             >
               <Text style={styles.secondaryText}>내 파우치로 가기</Text>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.primaryButton}
               onPress={() =>
                 navigation.getParent()?.navigate('Home')
               }
             >
               <Text style={styles.primaryText}>홈으로 가기</Text>
             </TouchableOpacity>
           </View>
         ) : (
           <TouchableOpacity
             style={styles.deleteButton}
             onPress={handleDelete}
           >
             <Text style={styles.deleteText}>화장품 삭제하기</Text>
           </TouchableOpacity>
         )}
       </ScrollView>
     </SafeAreaView>
   );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },

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

  date: { color: '#fff', fontSize: 14, marginBottom: 20 },

  image: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#111',
  },

  /* ===== Detect 전용 버튼 ===== */

  detectActions: {
    marginTop: 24,
    gap: 12,
    marginBottom: 40,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  /* ===== 기존 삭제 버튼 (유지) ===== */

  deleteButton: {
    borderWidth: 2,
    borderColor: '#ff4d4f',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },

  deleteText: { color: '#ff4d4f', fontSize: 16, fontWeight: '700' },

  errorText: { color: '#ff6b6b', fontSize: 15 },

  scrollContent: {
    padding: 20,
    paddingBottom: 48, // 🔥 하단 네비게이션/제스처바 여유
  },
});
