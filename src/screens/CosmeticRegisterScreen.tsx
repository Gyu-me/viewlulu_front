/**
 * CosmeticRegisterScreen (서버 연동 최종본)
 * --------------------------------------------------
 * - 화장품 등록용 카메라 화면
 * - 총 4장 촬영
 * - 촬영된 사진을 순차적으로 서버 업로드
 * - 업로드 완료 시 MyPouch로 이동
 *
 * ❗ 기존 UX 흐름 유지
 * ❗ API 연동만 추가
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';

import { uploadCosmeticApi } from '../api/cosmetic.api';

const MAX_PHOTOS = 4;

export default function CosmeticRegisterScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation<any>();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const currentIndex = photos.length;

  /* ================= 촬영 ================= */
  const handleCapture = async () => {
    if (!cameraRef.current || currentIndex >= MAX_PHOTOS) return;

    const photo = await cameraRef.current.takePhoto();
    setPhotos(prev => [...prev, `file://${photo.path}`]);
  };

  /* ================= 업로드 ================= */
  const handleUpload = async () => {
    try {
      setUploading(true);

      for (let i = 0; i < photos.length; i++) {
        await uploadCosmeticApi({
          uri: photos[i],
          name: `cosmetic_${i + 1}.jpg`,
          type: 'image/jpeg',
        });
      }

      Alert.alert('등록 완료', '화장품이 내 파우치에 저장되었습니다.', [
        {
          text: '확인',
          onPress: () =>
            navigation.replace('Main', {
              screen: 'MyPouch',
            }),
        },
      ]);
    } catch {
      Alert.alert(
        '업로드 실패',
        '화장품 등록 중 오류가 발생했습니다.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#FFD400' }}>카메라 준비 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      {/* 상단 안내 */}
      <View style={styles.topOverlay}>
        <Text style={styles.title}>
          {currentIndex + 1} / {MAX_PHOTOS} 촬영
        </Text>
        <Text style={styles.sub}>
          화장품을 화면 중앙에 두고 촬영해주세요
        </Text>
      </View>

      {/* 썸네일 */}
      {photos.length > 0 && (
        <View style={styles.thumbnailBox}>
          <Image
            source={{ uri: photos[photos.length - 1] }}
            style={styles.thumbnail}
          />
        </View>
      )}

      {/* 버튼 */}
      {photos.length < MAX_PHOTOS ? (
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <Text style={styles.captureText}>촬영하기</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && { opacity: 0.6 },
          ]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadText}>
            {uploading ? '업로드 중...' : '내 파우치에 저장'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  title: {
    color: '#FFD400',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },

  sub: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  thumbnailBox: {
    position: 'absolute',
    bottom: 160,
    right: 20,
  },

  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },

  captureButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 36,
  },

  captureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  uploadButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 36,
  },

  uploadText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
