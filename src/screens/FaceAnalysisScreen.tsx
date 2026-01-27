/**
 * FaceAnalysisScreen
 * --------------------------------------------------
 * 얼굴형 분석 촬영 화면 (FeatureStack 전용)
 *
 * 기능 설명:
 * - 전면 카메라를 사용하여 얼굴 촬영
 * - 가이드 프레임을 제공하여 올바른 촬영 위치 안내
 * - 촬영 완료 시 FaceResultScreen으로 이동
 *
 * 구조 원칙 (중요):
 * - 이 화면은 Home이 아님
 * - BottomTab / HomeStack 과 완전히 분리된 FeatureStack 소속
 * - 촬영 → 결과 → 종료 시에만 Home으로 복귀
 *
 * 접근성 고려:
 * - 촬영 후 즉시 결과 화면으로 이동
 * - 탭 이동 시 화면 상태가 유지되지 않도록 구조 분리
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Svg, { Rect, Defs, Mask } from 'react-native-svg';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeatureStackParamList } from '../navigation/FeatureStackNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type Nav = NativeStackNavigationProp<FeatureStackParamList>;

const { width, height } = Dimensions.get('window');

const FRAME_WIDTH = width * 0.75;
const FRAME_HEIGHT = height * 0.5;
const FRAME_RADIUS = 28;


export default function FaceAnalysisScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const FRAME_TOP = height * 0.20 + insets.top;

  // ✅ 카메라 권한
  const { hasPermission, requestPermission } = useCameraPermission();

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) {
      requestPermission(); // 🔥 시스템 기본 팝업 자동 호출
    }
  }, [hasPermission, requestPermission]);

  /* ================= Capture ================= */

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePhoto();

    navigation.navigate('FaceResult', {
      mode: 'analysis',
      photoPath: photo.path,
    });
  };

  /* ================= Render Guards ================= */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#FFD400', marginBottom: 16 }}>
          얼굴형 분석을 위해 카메라 권한이 필요합니다.
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

  /* ================= Main Render ================= */

  return (
    <View style={styles.container}>
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      {/* 안내 텍스트 (SafeArea 적용 위치) */}
      <View
        style={[
          styles.textArea,
          { paddingTop: insets.top + 30 },
        ]}
      >
        <Text style={styles.title}>얼굴형 분석</Text>
        <Text style={styles.desc}>
          얼굴을 프레임 안에 맞추고{'\n'}
          정면을 바라본 상태에서 촬영해주세요.
        </Text>
      </View>

      {/* 오버레이 */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id="mask">
            <Rect width="100%" height="100%" fill="white" />
            <Rect
              x={(width - FRAME_WIDTH) / 2}
              y={FRAME_TOP}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              rx={FRAME_RADIUS}
              ry={FRAME_RADIUS}
              fill="black"
            />
          </Mask>
        </Defs>

        <Rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#mask)"
        />
      </Svg>

      <View
        style={[
          styles.frame,
          {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            borderRadius: FRAME_RADIUS,
            top: FRAME_TOP,
            left: (width - FRAME_WIDTH) / 2,
          },
        ]}
      />

      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Text style={styles.captureText}>촬영하기</Text>
      </TouchableOpacity>
    </View>
  );
}


/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFD400',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  desc: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  frame: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFD400',
  },
  captureButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 36,
  },
  captureText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
