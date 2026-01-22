/**
 * 📁 CosmeticRegisterScreen.tsx
 * --------------------------------------------------
 * FINAL STABLE (촬영 상태 완전 초기화)
 *
 * - 화면에 들어올 때마다 촬영 상태 초기화
 * - Confirm → 재촬영 → Register 진입 시 이전 기록 완전 제거
 * - 뒤로가기 시 MyPouch로 즉시 종료
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import CameraGate from '../components/CameraGate';
import { BackHandler } from 'react-native';
import { useEffect } from 'react';


const MAX_PHOTOS = 4;

const CAPTURE_GUIDE = [
  { title: '정면 촬영', desc: '화장품의 정면이 보이도록 촬영해주세요' },
  { title: '후면 촬영', desc: '화장품의 뒷면이 보이도록 촬영해주세요' },
  { title: '상단 촬영', desc: '화장품의 위쪽이 보이도록 촬영해주세요' },
  { title: '하단 촬영', desc: '화장품의 바닥이 잘 보이도록 촬영해주세요' },
];

export default function CosmeticRegisterScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation<any>();

  const [photos, setPhotos] = useState<string[]>([]);
  const isResettingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // 🔥 이미 우리가 reset 중이면 그냥 통과
      if (isResettingRef.current) {
        return;
      }

      e.preventDefault();
      isResettingRef.current = true;

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            state: {
              routes: [{ name: 'MyPouch' }],
            },
          },
        ],
      });
    });

    return unsubscribe;
  }, [navigation]);



  /* ================= 🔥 핵심: 화면 진입 시 무조건 초기화 ================= */

  useFocusEffect(
    useCallback(() => {
      // 🔥 이전 촬영 기록 완전 제거
      setPhotos([]);
    }, [])
  );

  const currentIndex = photos.length;
  const currentGuide =
    CAPTURE_GUIDE[currentIndex] ??
    CAPTURE_GUIDE[CAPTURE_GUIDE.length - 1];

  const handleCapture = async () => {
    if (!cameraRef.current || currentIndex >= MAX_PHOTOS) return;

    const photo = await cameraRef.current.takePhoto();
    const next = [...photos, `file://${photo.path}`];
    setPhotos(next);

    if (next.length === MAX_PHOTOS) {
      navigation.navigate('CosmeticConfirm', { photos: next });
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
    <CameraGate>
      <View style={styles.container}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          photo
        />

        <View style={styles.topOverlay}>
          <Text style={styles.step}>
            {currentIndex + 1} / {MAX_PHOTOS}
          </Text>
          <Text style={styles.title}>{currentGuide.title}</Text>
          <Text style={styles.sub}>{currentGuide.desc}</Text>
        </View>

        {photos.length > 0 && (
          <View style={styles.thumbnailBox}>
            <Image
              source={{ uri: photos[photos.length - 1] }}
              style={styles.thumbnail}
            />
          </View>
        )}

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <Text style={styles.captureText}>촬영하기</Text>
        </TouchableOpacity>
      </View>
    </CameraGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  step: { color: '#FFD400', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  title: { color: '#FFD400', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#FFFFFF', fontSize: 14 },
  thumbnailBox: { position: 'absolute', bottom: 160, right: 20 },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD400',
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
  captureText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});
