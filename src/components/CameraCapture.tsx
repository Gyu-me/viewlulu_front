/**
 * CameraCapture (서버 연동 최종본)
 * --------------------------------------------------
 * - Vision Camera 촬영
 * - 촬영 직후 서버(/photos) 업로드
 * - 업로드 완료 후 path 반환
 * - 기존 사용처 로직 유지
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

import { uploadPhotoApi } from '../api/photo.api';

type Props = {
  onCapture: (path: string) => void;
  useFront?: boolean;
  showFaceGuide?: boolean;
};

export default function CameraCapture({
  onCapture,
  useFront = true,
  showFaceGuide = false,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice(useFront ? 'front' : 'back');
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      const uri = `file://${photo.path}`;

      // ✅ 서버 업로드
      await uploadPhotoApi(uri);

      // ✅ 기존 흐름 유지
      onCapture(photo.path);
    } catch (e: any) {
      Alert.alert(
        '촬영 실패',
        e?.response?.data?.message ?? '사진 업로드 실패',
      );
    } finally {
      setLoading(false);
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
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      {showFaceGuide && (
        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
        </View>
      )}

      <TouchableOpacity
        style={styles.captureButton}
        onPress={takePhoto}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.captureText}>촬영하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  faceGuide: {
    width: 260,
    height: 340,
    borderRadius: 170,
    borderWidth: 3,
    borderColor: '#FFD400',
  },

  captureButton: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 32,
  },

  captureText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
