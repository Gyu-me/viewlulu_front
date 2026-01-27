/**
 * hotword.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * - "뷰루루" 음성 호출(Hotword) 전용 컨트롤러
 * - 실제 음성 인식 엔진은 추후 주입
 *
 * 책임:
 * - 음성 호출 활성화 / 비활성화
 * - 현재 실행 상태 관리
 * - Home 화면에서만 안전하게 동작
 *
 * ❗ 이 파일은 "엔진 독립"
 * ❗ Android / iOS / Whisper / Porcupine 교체 가능
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_WAKE_KEY = 'voiceWakeEnabled';

/* ================= Types ================= */

type HotwordCallback = () => void;

/* ================= Internal State ================= */

/**
 * 현재 리스너 실행 여부
 */
let isRunning = false;

/**
 * "뷰루루" 감지 시 실행할 콜백
 */
let onWakeCallback: HotwordCallback | null = null;

/* ================= Utils ================= */

/**
 * 설정에서 음성 호출 활성화 여부 확인
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
export const startHotwordListener = async (
  onWake: HotwordCallback
) => {
  // 이미 실행 중이면 무시
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
   * 🔥 실제 음성 인식 엔진 start 위치
   *
   * 예:
   * - SpeechRecognizer.startListening()
   * - Voice.start()
   * - Whisper stream start
   */
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
   * 🔥 실제 음성 인식 엔진 stop 위치
   *
   * 예:
   * - SpeechRecognizer.stopListening()
   * - Voice.stop()
   * - Whisper stream close
   */
};

/**
 * 🚨 엔진이 "뷰루루" 감지했을 때 호출
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
