/**
 * CosmeticDetectScreen (FINAL)
 * --------------------------------------------------
 * - 촬영 이미지 리사이즈 후 detect 호출
 * - Camera 세션 충돌 방지 (Network Error / timeout 해결)
 * - 기존 결과 네비게이션 유지
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ImageResizer from 'react-native-image-resizer';

import { colors } from '../theme/colors';
import { detectCosmeticApi } from '../api/cosmeticDetect.api';
import { detectCosmeticTestApi } from '../api/cosmeticDetect.api';

/* ================= DEBUG ================= */

const now = () => new Date().toISOString().slice(11, 23);
const log = (...a: any[]) => console.log(`[${now()}][Detect]`, ...a);
const errlog = (...a: any[]) =>
  console.error(`[${now()}][Detect][ERR]`, ...a);

/* ================= Component ================= */

export default function CosmeticDetectScreen() {
  const navigation = useNavigation<any>();
  const cameraRef = useRef<Camera>(null);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= Focus ================= */

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  /* ================= Capture ================= */

const handleCapture = async () => {
  if (loading || !cameraRef.current) return;

  try {
    setLoading(true);
    log('capture start');

    const photo = await cameraRef.current.takePhoto({ flash: 'off' });
    log('photo path', photo.path);

    setIsActive(false);
    await new Promise(res => setTimeout(res, 300));

    const resized = await ImageResizer.createResizedImage(
      `file://${photo.path}`,
      640,
      640,
      'JPEG',
      80
    );

    const payload = {
      uri: resized.uri,
      name: 'capture.jpg',
      type: 'image/jpeg',
    };

    log('before detect api', payload);

    const result = await detectCosmeticApi(payload);
    log('after detect api', result);

    // ✅ 1. 인식 성공
    if (result.detectedId) {
      navigation.replace('CosmeticDetectResult', {
        cosmeticId: result.detectedId,
      });
      return;
    }

    // ✅ 2. 인식 실패 (정상 흐름)
    Alert.alert(
      '인식 실패',
      '등록된 화장품과 일치하지 않습니다.\n나의 파우치로 이동합니다.',
      [
        {
          text: 'OK',
          onPress: () => {
            setLoading(false);
            navigation.popToTop(); // ✅ 나의 파우치로 복귀
          },
        },
      ],
      { cancelable: false }
    );


  } catch (e: any) {
    errlog('detect error', e?.message, e);

    if (e?.message === 'NETWORK_ERROR') {
      Alert.alert(
        '네트워크 오류',
        '서버와 연결이 불안정합니다.\n잠시 후 다시 시도해주세요.'
      );
      return;
    }

    Alert.alert(
      '인식 실패',
      '인식에 실패했습니다.\n나의 파우치로 이동합니다.',
      [
        {
          text: 'OK',
          onPress: () => {
            setLoading(false);
            navigation.popToTop(); // ✅ 나의 파우치로 복귀
          },
        },
      ],
      { cancelable: false }
    );

  }
};

  /* ================= Render ================= */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={requestPermission}
        >
          <Text style={styles.primaryText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>카메라 로딩 중...</Text>
        <ActivityIndicator color={colors.primary} />
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

      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={loading}
        >
          <Text style={styles.captureText}>
            {loading ? '인식 중...' : '촬영하기'}
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 24,
  },
  text: { color: '#fff', fontSize: 15, textAlign: 'center' },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: { color: '#000', fontWeight: '700' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  captureText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
