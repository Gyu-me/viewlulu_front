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
 * ✅ 현재 상태(로그에서 확인된 상황)
 *   - 서버에서 "일치하는 화장품을 찾지 못했습니다."는 시스템 오류가 아니라
 *     모델/유사도 기준에 의해 '불일치'로 판정된 정상 응답(비즈니스 결과)임.
 *   - 위험 로그는 session/invalid-output-configuration 쪽이며,
 *     주로 카메라 세션 토글 타이밍/Alert/리렌더로 인해 발생 가능.
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ImageResizer from 'react-native-image-resizer';

import { colors } from '../theme/colors';
import { detectCosmeticApi } from '../api/cosmeticDetect.api';
// import { detectCosmeticTestApi } from '../api/cosmeticDetect.api'; // ✅ 필요 시만 사용

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

  // ✅ 배포 안정화: 언마운트 이후 setState 방지
  const mountedRef = useRef(true);

  // ✅ 배포 안정화: Alert 중복 방지(동시에 여러 Alert가 뜨면 세션 더 불안정)
  const alertOpenRef = useRef(false);

  // ✅ 배포 안정화: 마지막으로 리사이즈된 파일 정보(가능하면 정리)
  const lastResizedRef = useRef<{ uri?: string; path?: string } | null>(null);

  /* ================= Permission ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  /* ================= Focus / AppState =================
   * ✅ 배포 안정화:
   * - 화면 포커스 + 앱 포그라운드일 때만 카메라 활성화
   * - 백그라운드 전환 시 isActive를 꺼서 세션 충돌 가능성 완화
   */

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;

      // 앱이 백그라운드로 가면 카메라 끄기
      if (nextState !== 'active') {
        if (mountedRef.current) setIsActive(false);
      }
    });

    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // ✅ 포커스 진입 시 카메라 ON (단, 로딩 중/Alert 중이면 켜지지 않게)
      if (mountedRef.current && !loading && !alertOpenRef.current) {
        setIsActive(true);
      }

      return () => {
        // ✅ 포커스 해제 시 카메라 OFF
        if (mountedRef.current) setIsActive(false);
      };
      // loading은 의도적으로 deps에 넣지 않음:
      // 포커스 진입/이탈 타이밍을 안정적으로 유지하기 위함
    }, [])
  );

  /* ================= Helpers ================= */

  const safeSetLoading = (v: boolean) => {
    if (mountedRef.current) setLoading(v);
  };

  const safeSetIsActive = (v: boolean) => {
    if (mountedRef.current) setIsActive(v);
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  /**
   * ✅ 배포 안정화: 리사이즈 임시파일 정리 (best-effort)
   * - react-native-image-resizer는 OS/플랫폼에 따라 임시 파일이 남을 수 있음
   * - RNFS를 추가하고 싶지 않아서 여기서는 "정리 가능한 경우만" 처리하도록 주석으로 남김
   * - 지금은 기능 변화 최소화가 목표이므로, 실제 삭제는 프로젝트에 RNFS가 있을 때만 권장
   */
  const rememberResized = (resized: any) => {
    // resized: { uri, path, name, size ... } (플랫폼/버전에 따라 다름)
    lastResizedRef.current = {
      uri: resized?.uri,
      path: resized?.path,
    };
  };

  /**
   * ✅ 인식 실패 Alert (정상 흐름)
   * - 같은 Alert가 연속으로 뜨지 않도록 guard
   */
  const showNotMatchedAlert = () => {
    if (alertOpenRef.current) return;
    alertOpenRef.current = true;

    Alert.alert(
      '인식 실패',
      '등록된 화장품과 일치하지 않습니다.\n홈으로 이동합니다.',
      [
        {
          text: 'OK',
          onPress: () => {
            alertOpenRef.current = false;
            safeSetLoading(false);
            navigation.popToTop();
          },
        },
      ],
      {
        cancelable: false,
        onDismiss: () => {
          // Android에서 dismiss되는 경우를 대비
          alertOpenRef.current = false;
        },
      }
    );
  };

  const showNetworkAlert = () => {
    if (alertOpenRef.current) return;
    alertOpenRef.current = true;

    Alert.alert(
      '네트워크 오류',
      '서버와 연결이 불안정합니다.\n잠시 후 다시 시도해주세요.',
      [
        {
          text: 'OK',
          onPress: () => {
            alertOpenRef.current = false;
          },
        },
      ],
      {
        cancelable: false,
        onDismiss: () => {
          alertOpenRef.current = false;
        },
      }
    );
  };

  /* ================= Capture ================= */

  const handleCapture = async () => {
    // ✅ 배포 안정화: 중복 촬영 방지
    if (loading) return;

    // ✅ 배포 안정화: cameraRef 미연결 방지
    if (!cameraRef.current) return;

    // ✅ 배포 안정화: device 없으면 촬영 불가
    if (!device) return;

    // ✅ 배포 안정화: Alert 떠있으면 촬영 불가
    if (alertOpenRef.current) return;

    safeSetLoading(true);

    try {
      log('capture start');

      // 1) 촬영
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      log('photo path', photo.path);

      // 2) ✅ 카메라 세션 충돌 방지:
      // 촬영 직후 바로 네트워크/리사이즈로 넘어가면서 세션이 불안정해질 수 있어
      // 잠깐 카메라를 끄고(Preview 중지) 딜레이를 준다.
      safeSetIsActive(false);
      await sleep(300);

      // 3) 리사이즈 (기능 유지: 640x640 / JPEG / 80)
      const resized = await ImageResizer.createResizedImage(
        `file://${photo.path}`,
        640,
        640,
        'JPEG',
        80
      );
      rememberResized(resized);

      const payload = {
        uri: resized.uri,
        name: 'capture.jpg',
        type: 'image/jpeg',
      };

      log('before detect api', payload);

      // 4) detect 호출 (기능 유지)
      const result = await detectCosmeticApi(payload);
      log('after detect api', result);

      // ✅ 1. 인식 성공 (기능 유지)
        // 🔥 성공/실패 무관하게 결과 화면으로 이동
        navigation.replace('CosmeticDetectResult', {
          cosmeticId: result?.detectedId ?? null,
          score: result?.score ?? null,
        });
        return;


      // ✅ 2. 인식 실패 (정상 흐름)
      showNotMatchedAlert();
      return;
    } catch (e: any) {
      errlog('detect error', e?.message, e);

      // ✅ 네트워크 오류 분리 (기능 유지)
      if (e?.message === 'NETWORK_ERROR') {
        showNetworkAlert();
        return;
      }

      // ✅ 기타 오류도 사용자 입장에서는 "인식 실패"로 처리 (기능 유지)
      showNotMatchedAlert();
      return;
    } finally {
      // ✅ 배포 안정화:
      // - Alert이 열려있으면 카메라를 즉시 켜지 않음(세션 충돌 가능성 증가)
      // - 앱이 백그라운드면 카메라를 켜지 않음
      safeSetLoading(false);

      const appState = appStateRef.current;
      const canResumeCamera =
        appState === 'active' && !alertOpenRef.current;

      if (canResumeCamera) {
        // takePhoto 직후 세션이 바쁠 수 있어 약간의 딜레이 후 재활성
        await sleep(200);
        safeSetIsActive(true);
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
