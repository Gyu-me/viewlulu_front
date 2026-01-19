/**
 * 📁 CosmeticConfirmScreen.tsx (최종 안정본 + 에러 로그 강화 + 413 처리 추가)
 * --------------------------------------------------
 * 기능 요약
 * - 촬영된 사진 확인
 * - 화장품 이름 입력 (필수)
 * - 사진 여러 장 = 화장품 1개 저장
 *
 * 오류 처리 (Alert 출력 목록)
 * 1️⃣ 입력 오류
 *   - 화장품 이름 미입력
 *   - 저장할 사진 없음
 *
 * 2️⃣ 서버 오류 (Axios 기반)
 *   - 413 Payload Too Large
 *     → "사진 용량이 너무 큽니다. 다시 촬영해 주세요."
 *   - 기타 서버 응답 오류 (status + response data 표시)
 *
 * 3️⃣ 네트워크 오류
 *   - 요청은 갔으나 서버 응답 없음
 *
 * 4️⃣ Axios 설정 오류 / 알 수 없는 오류
 *
 * ※ 기존 로직/구조/스타일 절대 변경 없음
 * ※ 413 오류 메시지 처리만 추가됨
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { createCosmeticApi } from '../api/cosmetic.api';
import { colors } from '../theme/colors';

type Route = RouteProp<
  { CosmeticConfirm: { photos: string[] } },
  'CosmeticConfirm'
>;

export default function CosmeticConfirmScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();

  const photos = route.params?.photos ?? [];

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
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
      setLoading(true);

      console.log('🟡 저장 요청');
      console.log('name:', trimmedName);
      console.log('photos:', photos);

      const res = await createCosmeticApi({
        name: trimmedName,
        images: photos,
      });

      console.log('🟢 저장 성공:', res);

      Alert.alert('저장 완료', '내 파우치에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () =>
            navigation.replace('Main', { screen: 'MyPouchStack' }),
        },
      ]);
    } catch (error: any) {
      // 🔥🔥🔥 디버그 로그 핵심 구간 🔥🔥🔥
      console.log('🔥 RAW ERROR:', error);
      console.log('isAxiosError:', axios.isAxiosError(error));
      console.log('error type:', typeof error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.log('❌ RESPONSE STATUS:', error.response.status);
          console.log('❌ RESPONSE DATA:', error.response.data);
          console.log('❌ RESPONSE HEADERS:', error.response.headers);

          // ✅ ✅ ✅ 413 Payload Too Large 전용 처리 (추가된 부분)
          if (error.response.status === 413) {
            Alert.alert(
              '업로드 실패',
              '사진 용량이 너무 큽니다. 다시 촬영해 주세요.',
            );
            return;
          }

          Alert.alert(
            '저장 실패 (서버)',
            `status: ${error.response.status}\n${JSON.stringify(
              error.response.data,
              null,
              2,
            )}`,
          );
        } else if (error.request) {
          console.log('❌ REQUEST EXISTS, NO RESPONSE:', error.request);

          Alert.alert('네트워크 오류', '서버 응답이 없습니다.');
        } else {
          console.log('❌ AXIOS SETUP ERROR:', error.message);

          Alert.alert('요청 오류', error.message);
        }
      } else {
        console.log('❌ NON-AXIOS ERROR:', error);

        Alert.alert('알 수 없는 오류', String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>화장품 정보 확인</Text>

      {photos[0] && (
        <Image source={{ uri: photos[0] }} style={styles.mainImage} />
      )}

      <View style={styles.grid}>
        {photos.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={styles.thumb} />
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="화장품 이름"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
  },

  mainImage: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },

  thumb: {
    width: '48%',
    height: 120,
    borderRadius: 12,
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
    marginBottom: 20,
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
