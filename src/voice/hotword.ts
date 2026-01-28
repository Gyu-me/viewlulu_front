/**
 * hotword.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * - "뷰루루" 음성 호출(Hotword) 전용 컨트롤러
 * - HomeScreen에서만 활성화
 *
 * 책임:
 * - 음성 호출 활성화 / 비활성화
 * - 현재 실행 상태 관리
 * - "뷰루루" 감지 시 단일 콜백 트리거
 *
 * ❗ 엔진 독립 구조
 * ❗ Android / iOS / Whisper / Porcupine 교체 가능
 * ❗ 현재는 @react-native-voice/voice 기반 최소 동작 엔진 사용
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';

const VOICE_WAKE_KEY = 'voiceWakeEnabled';

/* ================= Types ================= */

type HotwordCallback = () => void;

/* ================= Internal State ================= */

/** 현재 Hotword 리스너 실행 여부 */
let isRunning = false;

/** "뷰루루" 감지 시 실행할 콜백 */
let onWakeCallback: HotwordCallback | null = null;

/* ================= Utils ================= */

/**
 * 설정에서 음성 호출 활성화 여부 확인
 * - 기본값: false
 */
const isWakeEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(VOICE_WAKE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
};

/* ================= Public API ================= */

/**
 * 🔊 Hotword Listener 시작
 * - HomeScreen 진입 시 호출
 * - 설정 OFF 상태면 아무 동작도 하지 않음
 */
export const startHotwordListener = async (onWake: HotwordCallback) => {
  // 중복 실행 방지
  if (isRunning) {
    console.log('[Hotword] already running');
    return;
  }

  const enabled = await isWakeEnabled();
  if (!enabled) {
    console.log('[Hotword] disabled by setting');
    return;
  }

  isRunning = true;
  onWakeCallback = onWake;

  console.log('[Hotword] started');

  /**
   * 🔥 실제 음성 인식 엔진 연결부
   * - 이 부분만 교체하면 엔진 변경 가능
   */

  Voice.onSpeechResults = event => {
    const results = event.value ?? [];
    console.log('[Hotword] speech results:', results);

    // "뷰루루" 포함 여부 확인
    const detected = results.some(text => text.includes('뷰루루'));

    if (detected) {
      triggerHotword();
    }
  };

  Voice.onSpeechError = error => {
    console.warn('[Hotword] speech error:', error);
  };

  try {
    await Voice.start('ko-KR');
  } catch (e) {
    console.warn('[Hotword] voice start failed:', e);
  }
};

/**
 * 🛑 Hotword Listener 중지
 * - HomeScreen 이탈 시 호출
 * - 중복 호출에도 안전
 */
export const stopHotwordListener = () => {
  if (!isRunning) return;

  console.log('[Hotword] stopped');

  isRunning = false;
  onWakeCallback = null;

  /**
   * 🔥 엔진 stop / 정리
   */
  Voice.stop();
  Voice.destroy();
};

/**
 * 🚨 "뷰루루" 감지 시 단일 진입점
 * - 실제 엔진에서는 이 함수만 호출하면 됨
 */
export const triggerHotword = () => {
  if (!isRunning) {
    console.log('[Hotword] trigger ignored (not running)');
    return;
  }

  console.log('[Hotword] WAKE WORD DETECTED');

  try {
    onWakeCallback?.();
  } catch (e) {
    console.warn('[Hotword] callback error:', e);
  }
};

/**
 * 🧪 상태 확인 (디버깅 / 테스트용)
 */
export const isHotwordRunning = () => isRunning;
