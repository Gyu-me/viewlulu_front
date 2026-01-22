/**
 * 📁 CosmeticConfirmScreen.tsx
 * --------------------------------------------------
 * FINAL STABLE (Stack RESET Version)
 *
 * - 촬영된 사진 4장 2x2 격자 표시
 * - 뒤로가기 시 사용자 의도 확인 Alert
 * - [확인] → 촬영 플로우 완전 초기화 후 재촬영
 * - [취소] → 현재 화면 유지
 * - CommonActions.reset 사용 (Register 중복 방지)
 * - 키보드 가림 / SafeArea 대응
 */

import React, { useRef, useState, useEffect } from 'react';
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
  BackHandler,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import axios from 'axios';
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



  /* ================= Back Intercept (RESET) ================= */

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // ✅ 우리가 허용한 이동이면 그냥 통과
      if (allowRemoveRef.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        '작성 중단',
        '현재 입력을 취소하고 사진을 다시 촬영하시겠어요?',
        [
          {
            text: '확인',
            onPress: () => {
              allowRemoveRef.current = true; // 🔥 핵심
              navigation.replace('CosmeticRegister');
            },
          },
          {
            text: '취소',
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    });

    return unsubscribe;
  }, [navigation]);



  /* ================= Save ================= */

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('입력 필요', '화장품 이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      isSavingRef.current = true; // 🔥 핵심

      await createCosmeticApi({
        name: trimmedName,
        images: photos,
      });

      Alert.alert('저장 완료', '내 파우치에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.replace('Main', {
              screen: 'MyPouch',
            });
          },
        },
      ]);
    } catch (e) {
      isSavingRef.current = false; // 실패 시 복구
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
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
          paddingBottom: 40 + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>화장품 정보 확인</Text>

        {/* 🔥 2x2 이미지 격자 */}
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
    padding: 20,
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
