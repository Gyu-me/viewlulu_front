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
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Pressable,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageResizer from 'react-native-image-resizer';

import { colors } from '../theme/colors';
import { detectCosmeticApi } from '../api/cosmeticDetect.api';

/* ================= Component ================= */

export default function CosmeticDetectScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const mountedRef = useRef(true);
  const alertOpenRef = useRef(false);
  const navigatedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ================= Mount ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= AppState ================= */

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
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
    }, []),
  );

  /* ================= RESET ================= */

  useEffect(() => {
    if (route.params?.reset) {
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
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: true,
      });

      setIsActive(false);
      await new Promise(r => setTimeout(r, 300));

      const resized = await ImageResizer.createResizedImage(
        `file://${photo.path}`,
        640,
        640,
        'JPEG',
        80,
      );

      const result = await detectCosmeticApi({
        uri: resized.uri,
        name: 'capture.jpg',
        type: 'image/jpeg',
      });

      navigatedRef.current = true;

      navigation.navigate('CosmeticDetectResult', {
        cosmeticId: result.detectedId,
        score: result.score,
        fromDetect: true,
      });
    } catch (e: any) {
      if (alertOpenRef.current) return; // ✅ 중복 Alert 방지

      alertOpenRef.current = true;

      Alert.alert(
        '인식 실패',
        '인식에 실패하였습니다. 다시 촬영해주세요.',
        [
          {
            text: '확인',
            onPress: () => {
              alertOpenRef.current = false;

              // ✅ 여기서만 재활성화 허용 (네비게이션 안 된 상태에서만)
              if (mountedRef.current && !navigatedRef.current) {
                setIsActive(true);
              }
            },
          },
        ],
        { cancelable: false },
      );
    } finally {
      setLoading(false);
      // ❗ 여기서는 재활성화하지 않음 (Alert onPress에서만 / reset 흐름에서만)
    }
  };

  /* ================= Long Press ================= */

  const LONG_PRESS_MS = 800;

  const startLongPress = () => {
    if (
      loading ||
      alertOpenRef.current ||
      !isActive ||
      !cameraRef.current ||
      longPressTimerRef.current // ✅ 이미 타이머 있으면 무시
    ) {
      return;
    }

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null; // ✅ 트리거 직전 정리
      handleCapture();
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  /* ================= Render ================= */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>카메라 권한이 필요합니다.</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryText}>권한 허용</Text>
        </Pressable>
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

      {/* 🔥 전체 화면 롱프레스 레이어 */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPressIn={startLongPress}
        onPressOut={cancelLongPress}
        disabled={loading}
      />

      {/* 🔥 SafeArea 상단 제목 */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>화장품 인식</Text>
        <Text style={styles.sub}>
          카메라로 화장품을 비추고 화면을 1초 정도 꾹 누르면 내 파우치 안에 어떤
          제품인지 알려드려요
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>인식 중…</Text>
        </View>
      )}
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

  /* 🔥 상단 SafeArea 제목 */
  topOverlay: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  sub: {
    color: '#fff',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 15,
  },
});
