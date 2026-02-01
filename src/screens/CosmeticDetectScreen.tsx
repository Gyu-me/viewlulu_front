/**
 * CosmeticDetectScreen.tsx
 * --------------------------------------------------
 * - 화장품 인식 카메라 화면
 * - 버튼 촬영 + Whisper STT(“찰칵/김치/치즈/사진/브이”) 자동 촬영
 * - TalkBack(스크린리더) ON 환경에서도 안정 동작
 * - 중복 캡처 / Alert 중첩 / stale state 문제 완전 차단
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
import {
  startWhisperRecording,
  stopWhisperRecording,
} from '../voice/whisperRecorder';
import { requestMicPermission } from '../voice/requestMicPermission';

export default function CosmeticDetectScreen() {
  /* ================= Navigation / Layout ================= */

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  /* ================= Camera ================= */

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [isActive, setIsActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= Stable Refs ================= */

  const mountedRef = useRef(true);
  const alertOpenRef = useRef(false);
  const navigatedRef = useRef(false);
  const capturingRef = useRef(false);
  const whisperLoopRef = useRef(false);

  const isActiveRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    cameraReadyRef.current = cameraReady;
  }, [cameraReady]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  /* ================= Mount / Unmount ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      whisperLoopRef.current = false;
      stopWhisperRecording();
    };
  }, []);

  /* ================= Permission ================= */

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= Reset ================= */

  useEffect(() => {
    if (route.params?.reset) {
      navigatedRef.current = false;
      alertOpenRef.current = false;
      capturingRef.current = false;
      setLoading(false);
      setCameraReady(false);
      setIsActive(true);
      navigation.setParams({ reset: false });
    }
  }, [route.params?.reset, navigation]);

  /* ================= Capture ================= */

  const handleCapture = useCallback(async () => {
    if (
      loadingRef.current ||
      capturingRef.current ||
      !cameraRef.current ||
      !device ||
      !isActiveRef.current ||
      !cameraReadyRef.current ||
      alertOpenRef.current ||
      navigatedRef.current
    ) {
      return;
    }

    capturingRef.current = true;
    whisperLoopRef.current = false;
    setLoading(true);

    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });

      setIsActive(false);
      await new Promise(r => setTimeout(r, 250));

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
    } catch (e) {
      alertOpenRef.current = true;
      Alert.alert(
        '인식 실패',
        '인식에 실패하였습니다. 다시 촬영해주세요.',
        [
          {
            text: '확인',
            onPress: async () => {
              alertOpenRef.current = false;
              capturingRef.current = false;
              setLoading(false);

              // 1️⃣ Camera 먼저 끈다
              setIsActive(false);
              setCameraReady(false);

              // 2️⃣ Camera OFF 상태에서 Whisper 시작
              const started = await startWhisperRecording();
              if (started) {
                startWhisperLoop();
              }

              // 3️⃣ Whisper가 안정화된 뒤 Camera 다시 켠다
              await new Promise(r => setTimeout(r, 300));
              setIsActive(true);
            },
          },
        ],
        { cancelable: false },
      );
    }
  }, [device, navigation]);

  /* ================= Whisper Loop (FIXED) ================= */

  /* ================= Whisper Loop (FINAL STABLE) ================= */

  const startWhisperLoop = useCallback(async () => {
    if (whisperLoopRef.current) return;
    whisperLoopRef.current = true;

    try {
      while (
        mountedRef.current &&
        isActiveRef.current &&
        !navigatedRef.current &&
        !capturingRef.current
      ) {
        // 1️⃣ 녹음 시작
        const started = await startWhisperRecording();
        if (!started) {
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        // 2️⃣ 사용자가 말할 시간 (중요)
        await new Promise(r => setTimeout(r, 5000));

        // 3️⃣ 녹음 종료 + STT
        const result = await stopWhisperRecording();

        const text = (result?.text || '').trim();

        // 🔥 로그는 최소화 (폭주 방지)
        if (__DEV__ && text) {
          console.log('[WHISPER TEXT]', text);
        }

        // 4️⃣ 너무 짧거나 빈 인식은 무시
        if (text.length < 2) {
          await new Promise(r => setTimeout(r, 800));
          continue;
        }

        // 5️⃣ 현실적인 판정 (contains_chalkak ❌)
        const hit =
          text.includes('찰') ||
          text.includes('칵') ||
          text.includes('치즈') ||
          text.includes('김치') ||
          text.includes('사진') ||
          text.includes('브이');

        if (hit) {
          handleCapture();
          break;
        }

        // 6️⃣ 다음 루프 전 쿨다운
        await new Promise(r => setTimeout(r, 1000));
      }
    } finally {
      // 🔥 어떤 경우에도 루프 상태 복구
      whisperLoopRef.current = false;
    }
  }, [handleCapture]);

  /* ================= Focus ================= */

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      // 🔥 Focus 진입 = Camera만 활성화
      setCameraReady(false);
      setIsActive(true);

      setTimeout(async () => {
        if (cancelled) return;

        try {
          await requestMicPermission();
        } catch (e) {
          console.warn('[MicPermission] skipped (activity not ready)');
        }
      }, 0);

      return () => {
        cancelled = true;

        // 🔥 Focus 해제 시 모든 Whisper 정리
        whisperLoopRef.current = false;
        capturingRef.current = false;

        setIsActive(false); // Camera OFF
        stopWhisperRecording(); // 혹시 남아있을 수 있는 녹음 정리
      };
    }, []),
  );

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
        onInitialized={() => {
          setCameraReady(true);
          startWhisperLoop(); // 🔥 카메라 준비 후 STT 시작
        }}
      />

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + 24 }]}
        accessibilityRole="header"
      >
        <Text style={styles.title}>화장품 인식</Text>
        <Text style={styles.sub}>
          카메라로 화장품을 비추면 어떤 제품인지 알려드려요
        </Text>
      </View>

      <View style={styles.overlay}>
        <Pressable
          style={styles.captureButton}
          onPress={handleCapture}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="촬영하기"
        >
          <Text style={styles.captureText}>
            {loading ? '인식 중...' : '촬영하기'}
          </Text>
        </Pressable>
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
  text: { color: '#fff' },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: { color: '#000', fontWeight: '700' },

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
  sub: { color: '#fff', fontSize: 14 },

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
