/**
 * CosmeticDetectScreen (서버 연동 최종본)
 * --------------------------------------------------
 * - 화장품 인식 전용 카메라
 * - 촬영 → 서버 전송
 * - detectedId 수신 후 Result 화면으로 replace 이동
 * - MyPouchStack 내부 흐름 유지
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { MyPouchStackParamList } from '../navigation/MyPouchStackNavigator';
import { detectCosmeticApi } from '../api/cosmetic.api';

type Nav = NativeStackNavigationProp<MyPouchStackParamList>;

export default function CosmeticDetectScreen() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current || loading) return;

    try {
      setLoading(true);

      const photo = await cameraRef.current.takePhoto();

      const result = await detectCosmeticApi({
        uri: `file://${photo.path}`,
        name: 'cosmetic.jpg',
        type: 'image/jpeg',
      });

      navigation.replace('CosmeticDetectResult', {
        detectedId: result.detectedId,
      });
    } catch (e) {
      Alert.alert(
        '인식 실패',
        '화장품 인식에 실패했습니다.\n다시 시도해주세요.'
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
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
      />

      <View style={styles.topOverlay}>
        <Text style={styles.title}>
          화장품을 화면 중앙에 비춰주세요
        </Text>
        <Text style={styles.sub}>
          촬영하면 인식 결과를 알려드려요
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.captureButton,
          loading && { opacity: 0.6 },
        ]}
        onPress={handleCapture}
        disabled={loading}
      >
        <Text style={styles.captureText}>
          {loading ? '인식 중...' : '촬영하기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= 스타일 ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topOverlay: {
    position: 'absolute',
    top: 40,
    width: '100%',
    alignItems: 'center',
  },

  title: {
    color: '#FFD400',
    fontSize: 20,
    fontWeight: 'bold',
  },

  sub: {
    color: '#FFD400',
    fontSize: 14,
    marginTop: 6,
  },

  captureButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
  },

  captureText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
