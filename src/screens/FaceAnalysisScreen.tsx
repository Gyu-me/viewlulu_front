/**
 * FaceAnalysisScreen (서버 연동 최종본)
 * --------------------------------------------------
 * - 촬영
 * - 서버 업로드 (/photos)
 * - 결과 화면으로 이동
 * - 기존 FeatureStack 흐름 유지
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Svg, { Rect, Defs, Mask } from 'react-native-svg';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeatureStackParamList } from '../navigation/FeatureStackNavigator';
import { uploadAnalysisPhotoApi } from '../api/analysis.api';

type Nav = NativeStackNavigationProp<FeatureStackParamList>;

const { width, height } = Dimensions.get('window');
const FRAME_WIDTH = width * 0.75;
const FRAME_HEIGHT = height * 0.5;
const FRAME_RADIUS = 28;
const FRAME_TOP = height * 0.18;

export default function FaceAnalysisScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePhoto();
      const uri = `file://${photo.path}`;

      await uploadAnalysisPhotoApi(uri);

      navigation.navigate('FaceResult', { mode: 'analysis' });
    } catch (e: any) {
      Alert.alert(
        '분석 실패',
        e?.response?.data?.message ?? '얼굴 분석에 실패했습니다.',
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
    <View style={styles.container}>
      <View style={styles.textArea}>
        <Text style={styles.title}>얼굴형 분석</Text>
        <Text style={styles.desc}>
          얼굴을 프레임 안에 맞추고{'\n'}
          정면을 바라본 상태에서 촬영해주세요.
        </Text>
      </View>

      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

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

      <TouchableOpacity
        style={styles.captureButton}
        onPress={handleCapture}
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
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  textArea: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 24,
  },
  title: { color: '#FFD400', fontSize: 28, fontWeight: '800', marginBottom: 12 },
  desc: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', lineHeight: 22 },

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
  captureText: { color: '#000', fontSize: 20, fontWeight: 'bold' },
});
