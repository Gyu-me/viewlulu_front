/**
 * 📁 CosmeticRegisterScreen.tsx
 * --------------------------------------------------
 * FINAL FIXED STABLE + SafeArea Padding Applied
 *
 * ✅ reset 신호 수신 시 촬영 상태 완전 초기화
 * ✅ Confirm → Register 복귀 후 5장/버튼 무반응 방지
 * ✅ 촬영 플로우 단일 상태 소스 유지
 * ✅ 뒤로가기 → MyPouch 구조 유지
 *
 * ✅ FIXED
 * - 카메라 세션 화면 이탈 시 완전 종료
 * - 중복 촬영 / 중복 네비게이션 방지
 * - Confirm 이동 직전 카메라 OFF + 딜레이
 * - CaptureStack 분리 구조에서도 TabBar 안전 처리
 * - 🔥 SafeArea 기반 상단 여백 (홈 타이틀과 시각적 통일)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ================= Constants ================= */

const MAX_PHOTOS = 4;

const CAPTURE_GUIDE = [
  { title: '정면 촬영', desc: '화장품의 정면이 보이도록 촬영해주세요' },
  { title: '후면 촬영', desc: '화장품의 뒷면이 보이도록 촬영해주세요' },
  { title: '상단 촬영', desc: '화장품의 위쪽이 보이도록 촬영해주세요' },
  { title: '하단 촬영', desc: '화장품의 바닥이 잘 보이도록 촬영해주세요' },
];

export default function CosmeticRegisterScreen() {
  const insets = useSafeAreaInsets(); // 🔥 SafeArea
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const cameraRef = useRef<Camera>(null);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [photos, setPhotos] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);

  // 내부 제어용 ref
  const isNavigatingRef = useRef(false);
  const isCapturingRef = useRef(false);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= Focus: Camera On / Off ================= */

  useFocusEffect(
    useCallback(() => {
      // ✅ 카메라 ON
      setIsActive(true);

      // ✅ 탭바 숨김
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        // ✅ 카메라 OFF
        setIsActive(false);

        // ✅ 탭바 복구
        parent?.setOptions({
          tabBarStyle: undefined,
        });
      };
    }, [navigation])
  );


  /* ================= Reset (Confirm → Register) ================= */

  useFocusEffect(
    useCallback(() => {
      if (route.params?.reset) {
        setPhotos([]);
        isNavigatingRef.current = false;
        isCapturingRef.current = false;

        setIsActive(true);
        navigation.setParams({ reset: false });
      }
    }, [route.params?.reset, navigation])
  );

  /* ================= Back Handling ================= */

  /* ================= Back Handling ================= */

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isNavigatingRef.current) return;

      e.preventDefault();
      isNavigatingRef.current = true;

      setIsActive(false);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              routes: [
                {
                  name: 'MyPouch', // ✅ 실제 탭 이름
                  state: {
                    routes: [{ name: 'MyPouch' }],
                  },
                },
              ],
            },
          },
        ],
      });
    }); // ✅ addListener 닫힘

    return unsubscribe;
  }, [navigation]);


  /* ================= TabBar Hide ================= */

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent?.();
      parent?.setOptions?.({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions?.({
          tabBarStyle: { display: 'flex' },
        });
      };
    }, [navigation])
  );

  /* ================= Capture ================= */

  const currentIndex = photos.length;
  const currentGuide =
    CAPTURE_GUIDE[currentIndex] ??
    CAPTURE_GUIDE[CAPTURE_GUIDE.length - 1];

  const handleCapture = async () => {
    if (
      !cameraRef.current ||
      !device ||
      currentIndex >= MAX_PHOTOS ||
      isNavigatingRef.current ||
      isCapturingRef.current ||
      !isActive
    ) {
      return;
    }

    isCapturingRef.current = true;

    try {
      const photo = await cameraRef.current.takePhoto();
      const uri = `file://${photo.path}`;

      if (currentIndex + 1 === MAX_PHOTOS) {
        isNavigatingRef.current = true;

        setIsActive(false);
        await new Promise(r => setTimeout(r, 150));

        navigation.navigate('CosmeticConfirm', {
          photos: [...photos, uri],
        });
        return;
      }

      setPhotos(prev => [...prev, uri]);
    } finally {
      isCapturingRef.current = false;
    }
  };

  /* ================= Render ================= */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
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
        isActive={isActive}
        photo
      />

      {/* 🔥 SafeArea 기반 상단 오버레이 */}
      <View
        style={[
          styles.topOverlay,
          {
            paddingTop: insets.top + 24, // 홈 paddingTop:48과 시각적 통일
          },
        ]}
      >
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

      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
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
  permissionText: { color: '#FFD400', fontSize: 15, marginBottom: 16 },
  permissionBtn: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: { color: '#000', fontWeight: '700' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingBottom: 18,
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
