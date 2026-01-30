/**
 * FaceAnalysisScreen (Android / ML Kit) - FULL RESTORED FINAL
 * --------------------------------------------------
 * ✅ 목표:
 * - "현재 안정적으로 잘 돌아가는 구조(useCameraPermission)"를 기반으로
 * - 이전에 만들었던 얼굴 인식 판정 로직(insideRatio/방향/거리/안정화/TTS 제어)을 전부 복원
 * - Hooks 순서 문제 / getSnapshot 오류 재발 방지 (가장 중요)
 *
 * --------------------------------------------------
 * 포함 기능(완전판):
 * 1) 처음 화면 진입 시 TTS 안내 제거
 * 2) 얼굴 중심점 ❌ -> 얼굴 박스 insideRatio(교집합/얼굴면적) 기준 ✅
 * 3) OFF_CENTER 방향 안내 (좌/우/상/하, 2개 조합)
 * 4) TOO_FAR / TOO_CLOSE 거리 판정
 * 5) 음성 겹침/반복 감소: 쿨다운 + GOOD 1회 + streak 안정화
 * 6) 가장 큰 얼굴 1개를 기준으로 판정
 * 7) 권한/포커스/앱 복귀/cleanup 안정화
 *
 * --------------------------------------------------
 * ⚠️ 중요한 구조 원칙:
 * - Hook은 "모두" 컴포넌트 상단에서 선언(조건부 실행 금지)
 * - return guards(permission/device)보다 아래에서 Hook 선언 금지
 * - 효과(useEffect) 내부에서 조건 분기하는 방식으로 안정화
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  NativeModules,
  AppState,
  AppStateStatus,
  Linking,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import Svg, { Rect, Defs, Mask } from 'react-native-svg';

import {
  useNavigation,
  useIsFocused,
  useFocusEffect,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeatureStackParamList } from '../navigation/FeatureStackNavigator';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { announceScreen, stopTts } from '../voice/tts';

/* =========================================================
 * Navigation
 * ======================================================= */

type Nav = NativeStackNavigationProp<FeatureStackParamList>;

/* =========================================================
 * Screen / Frame constants
 * ======================================================= */

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 프레임 크기(화면 비율 기반)
const FRAME_WIDTH = screenWidth * 0.85;
const FRAME_HEIGHT = screenHeight * 0.55;
const FRAME_RADIUS = 28;

// 프레임 Y 오프셋(대략 상단)
const FRAME_TOP_BASE = screenHeight * 0.18;

/* =========================================================
 * Native Module typing (ML Kit)
 * ======================================================= */

type FaceBounds = { x: number; y: number; width: number; height: number };

type FaceInfo = {
  bounds: FaceBounds;
  headEulerAngleY?: number; // yaw (optional)
  headEulerAngleZ?: number; // roll (optional)
};

type DetectFacesResult = {
  imageWidth: number;
  imageHeight: number;
  faces: FaceInfo[];
};

const { FaceDetector } = NativeModules as {
  FaceDetector: {
    detectFaces: (photoPath: string) => Promise<DetectFacesResult>;
  };
};

function normalizePhotoPath(p: string) {
  if (!p) return p;
  return p.startsWith('file://') ? p.replace('file://', '') : p;
}

/* =========================================================
 * Guidance status
 * ======================================================= */

type GuidanceStatus =
  | 'NO_FACE'
  | 'OFF_CENTER'
  | 'TOO_FAR'
  | 'TOO_CLOSE'
  | 'GOOD'
  | 'ERROR';

/* =========================================================
 * Helper: clamp
 * ======================================================= */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/* =========================================================
 * Helper: pick best face (largest area)
 * ======================================================= */

function pickBestFace(faces: FaceInfo[]): FaceInfo | null {
  if (!faces || faces.length === 0) return null;
  // 가장 큰 얼굴
  const sorted = [...faces].sort((a, b) => {
    const aa = a.bounds.width * a.bounds.height;
    const bb = b.bounds.width * b.bounds.height;
    return bb - aa;
  });
  return sorted[0] ?? null;
}

/* =========================================================
 * Core judgement function (FULL)
 * ---------------------------------------------------------
 * - frameRectN: 화면 프레임을 0~1 비율로 표현한 값
 * - 얼굴 bounds는 이미지 좌표
 * - frameRectN를 이미지 크기에 곱해 비교
 *
 * 판단 순서:
 * 1) 얼굴 없음 => NO_FACE
 * 2) insideRatio < INSIDE_OK_RATIO => OFF_CENTER + 방향 안내
 * 3) areaRatio 기반 TOO_FAR / TOO_CLOSE
 * 4) GOOD
 * ======================================================= */

function judgeFaceGuidance(
  res: DetectFacesResult,
  frameRectN: { xN: number; yN: number; wN: number; hN: number },
  config: {
    INSIDE_OK_RATIO: number;
    TH_RATIO: number;
    TOO_FAR_AREA_RATIO: number;
    TOO_CLOSE_AREA_RATIO: number;
  },
): { status: GuidanceStatus; message: string; debug?: any } {
  const { faces, imageWidth, imageHeight } = res;

  if (!faces || faces.length === 0) {
    return {
      status: 'NO_FACE',
      message:
        '얼굴이 아직 인식되지 않았어요. 핸드폰을 얼굴 정면에 두고, 조금 더 가까이 와주세요.',
      debug: { reason: 'faces.length === 0' },
    };
  }

  const best = pickBestFace(faces);
  if (!best) {
    return {
      status: 'NO_FACE',
      message:
        '얼굴이 아직 인식되지 않았어요. 핸드폰을 얼굴 정면에 두고, 조금 더 가까이 와주세요.',
      debug: { reason: 'best === null' },
    };
  }

  const face = best.bounds;

  // 얼굴 rect (image coords)
  const faceLeft = face.x;
  const faceTop = face.y;
  const faceRight = face.x + face.width;
  const faceBottom = face.y + face.height;

  // frame rect (image coords)
  const frameLeft = imageWidth * frameRectN.xN;
  const frameTop = imageHeight * frameRectN.yN;
  const frameRight = imageWidth * (frameRectN.xN + frameRectN.wN);
  const frameBottom = imageHeight * (frameRectN.yN + frameRectN.hN);

  // intersection
  const interLeft = Math.max(faceLeft, frameLeft);
  const interTop = Math.max(faceTop, frameTop);
  const interRight = Math.min(faceRight, frameRight);
  const interBottom = Math.min(faceBottom, frameBottom);

  const interW = Math.max(0, interRight - interLeft);
  const interH = Math.max(0, interBottom - interTop);

  const interArea = interW * interH;
  const faceArea = face.width * face.height;
  const insideRatio = faceArea > 0 ? interArea / faceArea : 0;

  // 1) insideRatio
  if (insideRatio < config.INSIDE_OK_RATIO) {
    // frame 밖으로 벗어난 정도
    const overLeft = Math.max(0, frameLeft - faceLeft); // 얼굴이 너무 왼쪽 -> "오른쪽으로"
    const overRight = Math.max(0, faceRight - frameRight); // 얼굴이 너무 오른쪽 -> "왼쪽으로"
    const overTop = Math.max(0, frameTop - faceTop); // 얼굴이 너무 위 -> "아래로"
    const overBottom = Math.max(0, faceBottom - frameBottom); // 얼굴이 너무 아래 -> "위로"

    // 흔들림 무시 threshold
    const TH = Math.min(imageWidth, imageHeight) * config.TH_RATIO;

    const candidates: Array<[number, string]> = [
      [overLeft, '오른쪽으로'],
      [overRight, '왼쪽으로'],
      [overTop, '아래로'],
      [overBottom, '위로'],
    ].sort((a, b) => b[0] - a[0]);

    const [maxVal, maxDir] = candidates[0];

    // 방향 → 행동 문구 매핑
    const directionActionMap: Record<string, string> = {
      왼쪽으로: '핸드폰을 왼쪽으로 조금 이동해주세요.',
      오른쪽으로: '핸드폰을 오른쪽으로 조금 이동해주세요.',
      위로: '핸드폰을 위로 조금 들어주세요.',
      아래로: '핸드폰을 아래로 조금 내려주세요.',
    };

    // 정서 프리픽스 (시각장애인 안정감 핵심)
    let prefix = '조금만 조정하면 돼요.';

    if (insideRatio < config.INSIDE_OK_RATIO * 0.6) {
      prefix = '아직 카메라가 많이 벗어났어요.';
    } else if (insideRatio < config.INSIDE_OK_RATIO * 0.85) {
      prefix = '거의 맞았어요.';
    }

    const action =
      maxVal > TH
        ? directionActionMap[maxDir]
        : '핸드폰을 가운데로 맞춰주세요.';

    const msg = `${prefix} ${action}`;

    return {
      status: 'OFF_CENTER',
      message: msg,
      debug: {
        insideRatio,
        overLeft,
        overRight,
        overTop,
        overBottom,
        TH,
      },
    };
  }

  // 2) distance by areaRatio
  const areaRatio = faceArea / (imageWidth * imageHeight);
  const tooFar = areaRatio < config.TOO_FAR_AREA_RATIO;
  const tooClose = areaRatio > config.TOO_CLOSE_AREA_RATIO;

  if (tooFar) {
    return {
      status: 'TOO_FAR',
      message: '조금 더 가까이 와주세요.',
      debug: { areaRatio },
    };
  }
  if (tooClose) {
    return {
      status: 'TOO_CLOSE',
      message: '조금만 멀리 떨어져주세요.',
      debug: { areaRatio },
    };
  }

  return {
    status: 'GOOD',
    message: '좋아요. 지금 촬영해 주세요!',
    debug: { insideRatio, areaRatio },
  };
}

/* =========================================================
 * MAIN COMPONENT
 * ======================================================= */

export default function FaceAnalysisScreen() {
  /* -------------------------------------------------------
   * Hooks: MUST be declared unconditionally at top
   * ----------------------------------------------------- */

  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIntroSpeakingRef = useRef(false);

  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');

  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const ttsEnabledRef = useRef(true);

  // Permission hook (stable baseline)
  const { hasPermission, requestPermission } = useCameraPermission();

  // UI states
  const [hintText, setHintText] = useState('얼굴을 프레임 안에 맞춰주세요.');
  const [debugText, setDebugText] = useState<string>(''); // optional UI debug

  const introDoneRef = useRef(false); //인트로후에 카메라 동작

  const didIntroRef = useRef(false);

  // Face check lock
  const isCheckingRef = useRef(false);

  // TTS control refs
  const lastStatusRef = useRef<GuidanceStatus | ''>('');
  const lastSpeakAtRef = useRef<number>(0);
  const speakingRef = useRef<boolean>(false);

  // streak stabilization
  const okStreakRef = useRef<number>(0);
  const failStreakRef = useRef<number>(0);

  // capture guard
  const isCapturingRef = useRef<boolean>(false);

  // appstate
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /* -------------------------------------------------------
   * Config (tunable parameters)
   * ----------------------------------------------------- */

  const CHECK_INTERVAL_MS = 2000;

  // TTS policy
  const SAME_STATUS_COOLDOWN_MS = 6500;
  const MIN_GAP_MS = 1200;
  const SPEAK_LOCK_MS = 900;

  // Stabilization
  const OK_TO_GOOD = 2; // GOOD 확정까지 연속 OK
  const FAIL_TO_NOFACE = 5; // NO_FACE 확정까지 연속 FAIL

  // Judgement config
  const judgeConfig = useMemo(
    () => ({
      INSIDE_OK_RATIO: 0.72,
      TH_RATIO: 0.03, // 3%
      TOO_FAR_AREA_RATIO: 0.06,
      TOO_CLOSE_AREA_RATIO: 0.38,
    }),
    [],
  );

  // Optional: verbose debug
  const DEBUG = false;

  /* -------------------------------------------------------
   * Frame rect calculation (screen -> normalized)
   * - NOTE: We include safeAreaTop in frameY
   * ----------------------------------------------------- */

  const frameTop = useMemo(() => {
    return FRAME_TOP_BASE + insets.top;
  }, [insets.top]);

  const getFrameRectN = useCallback(() => {
    const frameX = (screenWidth - FRAME_WIDTH) / 2;
    const frameY = frameTop;

    const xN = frameX / screenWidth;
    const yN = frameY / screenHeight;
    const wN = FRAME_WIDTH / screenWidth;
    const hN = FRAME_HEIGHT / screenHeight;

    // clamp for safety
    return {
      xN: clamp(xN, 0, 1),
      yN: clamp(yN, 0, 1),
      wN: clamp(wN, 0, 1),
      hN: clamp(hN, 0, 1),
    };
  }, [frameTop]);

  /* -------------------------------------------------------
   * Permission request (baseline behavior)
   * ----------------------------------------------------- */

  useEffect(() => {
    if (!hasPermission) {
      // system prompt
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  /* -------------------------------------------------------
   * App resume: if user changes permission in settings,
   * re-request or re-check quickly.
   * ----------------------------------------------------- */

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // background -> active
      if (prev.match(/inactive|background/) && nextState === 'active') {
        // Permission could have changed
        if (!hasPermission) {
          requestPermission();
        }
      }
    });

    return () => sub.remove();
  }, [hasPermission, requestPermission]);

  /* -------------------------------------------------------
   * Cleanup on focus change (no initial announcement)
   * - This is allowed because hook is unconditional
   * ----------------------------------------------------- */

  useFocusEffect(
    useCallback(() => {
      ttsEnabledRef.current = true;
      introDoneRef.current = false;

      return () => {
        ttsEnabledRef.current = false;
        stopTts();

        if (introTimerRef.current) {
          clearTimeout(introTimerRef.current);
          introTimerRef.current = null;
        }

        introDoneRef.current = false;
        lastStatusRef.current = '';
        lastSpeakAtRef.current = 0;
        speakingRef.current = false;
        isCheckingRef.current = false;
        isCapturingRef.current = false;
        okStreakRef.current = 0;
        failStreakRef.current = 0;
        setDebugText('');
      };
    }, []),
  );

  /*인트로 TTS 전용 useEffect */
  useEffect(() => {
    if (!isFocused) return;
    if (didIntroRef.current) return;

    didIntroRef.current = true;
    ttsEnabledRef.current = true;
    isIntroSpeakingRef.current = true; // 🔒 보호 시작

    stopTts();

    // 오디오 세션 안정화
    const startDelay = 500;

    setTimeout(() => {
      announceScreen(
        '지금부터 얼굴형 분석을 시작할게요. 잠시 움직이지 말고 음성 안내에만 집중해주세요. ' +
          '핸드폰을 얼굴 정면에 두고 조금 가까이 가져와 주세요. 제가 계속 안내해 드릴게요.',
      );
    }, startDelay);

    // ⏱ 실제 음성 길이보다 넉넉하게 (약 13초)
    const INTRO_TOTAL_MS = 13500;

    introTimerRef.current = setTimeout(() => {
      isIntroSpeakingRef.current = false; // 🔓 보호 해제
      introDoneRef.current = true; // 얼굴 체크 허용
    }, startDelay + INTRO_TOTAL_MS);

    return () => {
      // cleanup (중요)
      if (introTimerRef.current) {
        clearTimeout(introTimerRef.current);
        introTimerRef.current = null;
      }
      isIntroSpeakingRef.current = false;
    };
  }, [isFocused]);

  /* -------------------------------------------------------
   * TTS speak policy
   * ----------------------------------------------------- */

  const speakIfNeeded = useCallback(
    (status: GuidanceStatus, message: string) => {
      const now = Date.now();
      const prev = lastStatusRef.current;
      const changed = prev !== status;

      if (isIntroSpeakingRef.current) return;

      // GOOD은 1회만
      if (status === 'GOOD' && prev === 'GOOD') return;

      // 같은 상태 반복 쿨다운
      if (!changed && now - lastSpeakAtRef.current < SAME_STATUS_COOLDOWN_MS) {
        return;
      }

      // 상태 변경이어도 너무 촘촘하면 스킵
      if (changed && now - lastSpeakAtRef.current < MIN_GAP_MS) {
        return;
      }

      // 말하는 중이면 스킵
      if (speakingRef.current) return;

      // ❌ 화면 나갔으면 절대 말하지 않음
      if (!ttsEnabledRef.current) return;

      // 언젠가..checkFace 로직을 건드려서 실수해도 안전하기위한 보험?
      if (!introDoneRef.current) return;
      if (!ttsEnabledRef.current) return;

      speakingRef.current = true;

      // 겹침 방지
      stopTts();
      announceScreen('', message);

      lastStatusRef.current = status;
      lastSpeakAtRef.current = now;

      setTimeout(() => {
        speakingRef.current = false;
      }, SPEAK_LOCK_MS);
    },
    [MIN_GAP_MS, SAME_STATUS_COOLDOWN_MS, SPEAK_LOCK_MS],
  );

  /* -------------------------------------------------------
   * Stabilization: streak based
   * ----------------------------------------------------- */

  const applyStabilization = useCallback(
    (
      raw: { status: GuidanceStatus; message: string; debug?: any },
      prevStatus: GuidanceStatus | '',
      prevMessage: string,
    ) => {
      // Update streak
      if (raw.status === 'NO_FACE') {
        failStreakRef.current += 1;
        okStreakRef.current = 0;
      } else if (raw.status === 'ERROR') {
        // keep
      } else {
        okStreakRef.current += 1;
        failStreakRef.current = 0;
      }

      let stableStatus: GuidanceStatus = raw.status;
      let stableMessage: string = raw.message;

      // 1) GOOD은 연속 OK가 쌓였을 때만 확정
      if (raw.status === 'GOOD') {
        if (prevStatus !== 'GOOD' && okStreakRef.current < OK_TO_GOOD) {
          if (prevStatus) {
            stableStatus = prevStatus;
            stableMessage = prevMessage;
          }
        }
      }

      // 2) NO_FACE는 연속 FAIL이 쌓였을 때만 확정
      if (raw.status === 'NO_FACE') {
        // 직전이 GOOD이고 fail streak가 아직 작으면 GOOD 유지(튀는 안내 방지)
        if (prevStatus === 'GOOD' && failStreakRef.current < FAIL_TO_NOFACE) {
          stableStatus = 'GOOD';
          stableMessage = '좋아요. 지금 촬영해 주세요!';
        } else if (failStreakRef.current < FAIL_TO_NOFACE) {
          // 아직 확정할 만큼 연속 실패가 아님 -> 이전 상태 유지
          if (prevStatus) {
            stableStatus = prevStatus as GuidanceStatus;
            stableMessage = prevMessage;
          }
        }
      }

      return {
        stableStatus,
        stableMessage,
        debug: raw.debug,
        streak: {
          ok: okStreakRef.current,
          fail: failStreakRef.current,
        },
      };
    },
    [FAIL_TO_NOFACE, OK_TO_GOOD],
  );

  /* -------------------------------------------------------
   * Core loop: takePhoto -> FaceDetector -> judge -> stabilize -> UI/TTS
   * ----------------------------------------------------- */

  const checkFace = useCallback(async () => {
    // 인트로 끝날 때까지 얼굴 체크 안 함
    if (!introDoneRef.current) return;
    if (isIntroSpeakingRef.current) return;

    // Stop conditions
    if (!hasPermission) return;
    if (!isFocused) return;
    if (!device) return;
    if (!cameraRef.current) return;

    if (isCapturingRef.current) return; // capture in progress
    if (isCheckingRef.current) return; // already running

    try {
      isCheckingRef.current = true;

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced', // or 'quality'
        flash: 'off',
        enableShutterSound: false,
        skipMetadata: false,
      });

      const path = normalizePhotoPath(photo.path);
      const result = await FaceDetector.detectFaces(path);

      const frameRectN = getFrameRectN();
      const raw = judgeFaceGuidance(result, frameRectN, judgeConfig);

      const prevStatus = lastStatusRef.current;
      const prevMessage = hintText;

      const stabilized = applyStabilization(raw, prevStatus, prevMessage);

      setHintText(stabilized.stableMessage);
      speakIfNeeded(stabilized.stableStatus, stabilized.stableMessage);

      if (DEBUG) {
        const dbg = {
          status: raw.status,
          stable: stabilized.stableStatus,
          msg: raw.message,
          stableMsg: stabilized.stableMessage,
          ...raw.debug,
          streak: stabilized.streak,
          frameRectN,
        };
        setDebugText(JSON.stringify(dbg, null, 2));
      } else {
        setDebugText('');
      }
    } catch (e) {
      const msg =
        '얼굴을 인식하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.';
      setHintText(msg);
      speakIfNeeded('ERROR', msg);

      if (DEBUG) {
        setDebugText(String(e));
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [
    DEBUG,
    applyStabilization,
    device,
    getFrameRectN,
    hasPermission,
    hintText,
    isFocused,
    judgeConfig,
    speakIfNeeded,
  ]);

  /* -------------------------------------------------------
   * Interval loop (unconditional hook, conditional run inside)
   * ----------------------------------------------------- */

  useEffect(() => {
    // Always set up interval, but only execute when conditions pass (inside checkFace)
    const id = setInterval(() => {
      checkFace();
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [CHECK_INTERVAL_MS, checkFace]);

  /* -------------------------------------------------------
   * Capture button
   * - stops TTS
   * - prevents checker loop temporarily
   * ----------------------------------------------------- */

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      isCapturingRef.current = true;
      stopTts();

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
        enableShutterSound: true,
        skipMetadata: false,
      });

      navigation.navigate('FaceResult', {
        mode: 'analysis',
        photoPath: photo.path,
      });
    } finally {
      // navigation will leave screen; but just in case
      isCapturingRef.current = false;
    }
  }, [navigation]);

  /* -------------------------------------------------------
   * Permission UI helpers
   * ----------------------------------------------------- */

  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      // fallback
      if (Platform.OS === 'android') {
        // If needed, could open app settings via intent, but openSettings is enough.
      }
    }
  }, []);

  /* -------------------------------------------------------
   * Render Guards (AFTER all hooks)
   * ----------------------------------------------------- */

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          얼굴형 분석을 위해 카메라 권한이 필요합니다.
        </Text>

        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>권한 허용</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.permissionBtn, { marginTop: 12 }]}
          onPress={openSettings}
        >
          <Text style={styles.permissionBtnText}>설정 열기</Text>
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

  /* -------------------------------------------------------
   * Main Render
   * ----------------------------------------------------- */

  return (
    <View style={styles.container}>
      {/* Camera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={hasPermission && isFocused}
        photo
      />

      {/* 안내 텍스트 */}
      <View style={[styles.textArea, { paddingTop: insets.top + 30 }]}>
        <Text style={styles.title}>얼굴형 분석</Text>

        <Text style={styles.hint}>음성 안내에 따라 얼굴을 맞춰주세요.</Text>

        {!!debugText && <Text style={styles.debug}>{debugText}</Text>}
      </View>

      {/* Overlay Mask */}
      <Svg
        width={screenWidth}
        height={screenHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <Mask id="mask">
            <Rect width="100%" height="100%" fill="white" />
            <Rect
              x={(screenWidth - FRAME_WIDTH) / 2}
              y={frameTop}
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

      {/* Frame Border */}
      <View
        style={[
          styles.frame,
          {
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            borderRadius: FRAME_RADIUS,
            top: frameTop,
            left: (screenWidth - FRAME_WIDTH) / 2,
          },
        ]}
      />

      {/* Capture Button */}
      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Text style={styles.captureText}>촬영하기</Text>
      </TouchableOpacity>
    </View>
  );
}

/* =========================================================
 * Styles
 * ======================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000',
  },

  permissionText: {
    color: '#FFD400',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },

  permissionBtn: {
    backgroundColor: '#FFD400',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },

  permissionBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
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

  hint: {
    marginTop: 10,
    color: '#E6E6E6',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },

  debug: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'left',
    width: '100%',
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
