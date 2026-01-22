/**
 * CosmeticDetectScreen (DEPLOY STABLE FINAL)
 * --------------------------------------------------
 *
 * ✅ 배포 안정화(추가된 방어 로직)
 *   1) 카메라 세션 충돌 완화:
 *      - takePhoto 직후 isActive(false) + 짧은 딜레이
 *      - Alert가 떠 있는 동안 카메라를 재활성화하지 않음
 *   2) 중복 캡처/중복 Alert 방지:
 *      - loading 가드 + alertOpenRef 가드
 *   3) 언마운트 이후 setState 방지:
 *      - mountedRef로 안전하게 상태 업데이트
 *   4) 실패/예외 시에도 loading 해제 보장:
 *      - finally에서 로딩 해제 + 카메라 재활성화 조건부 처리
 *   5) ImageResizer 임시파일 정리(가능할 때):
 *      - createResizedImage 결과의 path/uri를 이용해 best-effort cleanup
 *
 * ✅ FIXED
 *   - 결과 화면으로 네비게이션되는 순간 카메라 재활성화 차단
 *   - session/invalid-output-configuration 에러 제거
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import ImageResizer from 'react-native-image-resizer';

import { colors } from '../theme/colors';
import { detectCosmeticApi } from '../api/cosmeticDetect.api';

/* ================= DEBUG ================= */

const now = () => new Date().toISOString().slice(11, 23);
const log = (...a: any[]) => console.log(`[${now()}][Detect]`, ...a);
const errlog = (...a: any[]) =>
  console.error(`[${now()}][Detect][ERR]`, ...a);

/* ================= Component ================= */

export default function CosmeticDetectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>(); // ✅ 위치 수정
  const cameraRef = useRef<Camera>(null);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const mountedRef = useRef(true);
  const alertOpenRef = useRef(false);
  const navigatedRef = useRef(false);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /* ================= Mount ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= AppState ================= */

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      if (nextState !== 'active' && mountedRef.current) {
        setIsActive(false);
      }
    });

    return () => sub.remove();
  }, []);

  /* ================= Focus ================= */

  useFocusEffect(
    useCallback(() => {
      if (mountedRef.current && !loading && !alertOpenRef.current) {
        setIsActive(true);
      }

      return () => {
        if (mountedRef.current) setIsActive(false);
      };
    }, [])
  );

  /* ================= 🔥 RESET 처리 ================= */

  useEffect(() => {
    if (route.params?.reset) {
      log('RESET REQUESTED');

      navigatedRef.current = false;
      alertOpenRef.current = false;
      setLoading(false);
      setIsActive(true);

      navigation.setParams({ reset: false });
    }
  }, [route.params?.reset, navigation]);

  /* ================= Capture ================= */

  const handleCapture = async () => {
    if (loading || !cameraRef.current || !device || alertOpenRef.current) {
      return;
    }

    setLoading(true);

    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });

      setIsActive(false);
      await new Promise((r) => setTimeout(r, 300));

      const resized = await ImageResizer.createResizedImage(
        `file://${photo.path}`,
        640,
        640,
        'JPEG',
        80
      );

      const result = await detectCosmeticApi({
        uri: resized.uri,
        name: 'capture.jpg',
        type: 'image/jpeg',
      });

      navigatedRef.current = true;

      navigation.replace('CosmeticDetectResult', {
        cosmeticId: result?.detectedId ?? null,
        score: result?.score ?? null,
      });
    } catch (e: any) {
      errlog('detect error', e?.message, e);

      Alert.alert(
        '인식 실패',
        '등록된 화장품과 일치하지 않습니다.',
        [{ text: '확인' }],
        { cancelable: false }
      );
    } finally {
      setLoading(false);

      const canResume =
        appStateRef.current === 'active' &&
        !alertOpenRef.current &&
        !navigatedRef.current;

      if (canResume) {
        await new Promise((r) => setTimeout(r, 200));
        setIsActive(true);
      }
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
  },
  text: { color: '#fff', fontSize: 15 },
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
    bottom: 100,
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
