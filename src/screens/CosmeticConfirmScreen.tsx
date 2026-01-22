/**
 * 📁 CosmeticConfirmScreen.tsx
 * --------------------------------------------------
 * FINAL STABLE + SafeArea Unified
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { createCosmeticApi } from '../api/cosmetic.api';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Route = RouteProp<
  { CosmeticConfirm: { photos: string[] } },
  'CosmeticConfirm'
>;

export default function CosmeticConfirmScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const photos = route.params?.photos ?? [];

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const allowRemoveRef = useRef(false);
  const isSavingRef = useRef(false);

  /* ================= Back Intercept ================= */

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (allowRemoveRef.current) return;

      e.preventDefault();

      Alert.alert(
        '작성 중단',
        '현재 입력을 취소하고 사진을 다시 촬영하시겠어요?',
        [
          {
            text: '확인',
            onPress: () => {
              allowRemoveRef.current = true;
              navigation.replace('CosmeticRegister', { reset: true });
            },
          },
          { text: '취소', style: 'destructive' },
        ],
        { cancelable: false }
      );
    });

    return unsubscribe;
  }, [navigation]);

  /* ================= TabBar Hide ================= */

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle: undefined, // ✅ Root(MainTabs) 기준으로 복구
        });
      };
    }, [navigation])
  );


  /* ================= Save ================= */

  const handleSave = async () => {
    console.log('🟡 [Confirm] save pressed');

    if (isSavingRef.current || loading) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('입력 필요', '화장품 이름을 입력해주세요.');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('오류', '저장할 사진이 없습니다.');
      return;
    }

    try {
      isSavingRef.current = true;
      setLoading(true);

      console.log('🟡 [Confirm] calling createCosmeticApi...');
      const res = await createCosmeticApi({
        name: trimmedName,
        images: photos,
      });
      console.log('🟢 [Confirm] createCosmeticApi OK:', res);

      Alert.alert('저장 완료', '내 파우치에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            allowRemoveRef.current = true; // ✅ 핵심 추가

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'MainTabs',
                  state: {
                    routes: [
                      { name: 'MyPouch', params: { refresh: true } },
                    ],
                  },
                },
              ],
            });
          },
        },
      ]);

    } catch (e: any) {
      console.log('🔥 [Confirm] save error:', e);
      Alert.alert(
        '저장 실패',
        e?.message ? String(e.message) : '잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
      isSavingRef.current = false;
    }
  };

  /* ================= Render ================= */

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 24,   // 🔥 Register / Home과 동일
          paddingBottom: 40 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>화장품 정보 확인</Text>

        <View style={styles.grid}>
          {photos.slice(0, 4).map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.gridImage} />
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="화장품 이름"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
          onFocus={() => {
            setTimeout(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            }, 120);
          }}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>
            {loading ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20, // 🔥 상단은 SafeArea로 분리
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridImage: {
    width: '48%',
    height: 160,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 14,
  },
  saveText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
