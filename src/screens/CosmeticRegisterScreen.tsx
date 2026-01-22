/**
 * 📁 CosmeticRegisterScreen.tsx
 * --------------------------------------------------
 * FINAL STABLE
 *
 * - DetectScreen과 동일한 권한 UX
 * - 진입 즉시 시스템 권한 팝업
 * - CameraGate ❌ 제거 (중복 훅 방지)
 * - 뒤로가기 → MyPouch reset
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

/* ================= Constants ================= */

const MAX_PHOTOS = 4;

const CAPTURE_GUIDE = [
  { title: '정면 촬영', desc: '화장품의 정면이 보이도록 촬영해주세요' },
  { title: '후면 촬영', desc: '화장품의 뒷면이 보이도록 촬영해주세요' },
  { title: '상단 촬영', desc: '화장품의 위쪽이 보이도록 촬영해주세요' },
  { title: '하단 촬영', desc: '화장품의 바닥이 잘 보이도록 촬영해주세요' },
];

export default function CosmeticRegisterScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<Camera>(null);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [photos, setPhotos] = useState<string[]>([]);
  const isResettingRef = useRef(false);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= Back Handling ================= */

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isResettingRef.current) return;

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

  /* ================= Focus Reset ================= */

  useFocusEffect(
    useCallback(() => {
      setPhotos([]);
    }, [])
  );

  /* ================= Capture ================= */

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

  /* ================= Render ================= */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          카메라 권한이 필요합니다.
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#FFD400' }}>카메라 준비 중...</Text>
      </View>
    );
  }

  return (
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
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#FFD400',
    fontSize: 15,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#000',
    fontWeight: '700',
  },
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
