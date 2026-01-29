/**
 * hotword.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * 기능:
 * - "뷰루루" 음성 호출(Hotword) 제어 전담 모듈
 * - HomeScreen 진입 시 Hotword 활성화
 * - HomeScreen 이탈 시 Hotword 비활성화
 *
 * 책임:
 * - Hotword 실행/중지 상태 관리
 * - 음성 인식 엔진과 UI 로직 분리
 * - "뷰루루" 감지 시 단일 콜백 트리거
 *
 * 특징:
 * - 엔진 독립 구조 (Whisper / Porcupine / 기타 엔진 교체 가능)
 * - 현재는 @react-native-voice/voice 기반 최소 구현
 * - 중복 실행 / 중복 해제 방지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';

/* ================= Constants ================= */

/** 음성 호출 활성화 여부 저장 키 */
const VOICE_WAKE_KEY = 'voiceWakeEnabled';

/* ================= Types ================= */

/** Hotword 감지 시 실행될 콜백 타입 */
type HotwordCallback = () => void;

/* ================= Internal State ================= */

/** Hotword 리스너 현재 실행 여부 */
let isRunning = false;

/** "뷰루루" 감지 시 호출할 콜백 */
let onWakeCallback: HotwordCallback | null = null;

/* ================= Utils ================= */

/**
 * 설정에서 Hotword 사용 여부 확인
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
 * - 이미 실행 중이거나 설정 OFF 상태면 무시
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
   * 🎙 음성 인식 결과 수신
   * - "뷰루루" 포함 여부만 판단
   */
  Voice.onSpeechResults = event => {
    const results = event.value ?? [];
    console.log('[Hotword] speech results:', results);

    const detected = results.some(text => text.includes('뷰루루'));
    if (detected) {
      triggerHotword();
    }
  };

  /** 음성 인식 에러 처리 */
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
export const stopHotwordListener = async () => {
  if (!isRunning) {
    console.log('[Hotword] stop ignored (not running)');
    return;
  }

  console.log('[Hotword] stopping...');

  // 🔥 먼저 콜백과 상태 정리
  isRunning = false;
  onWakeCallback = null;

  try {
    // 순서 중요
    await Voice.stop();
  } catch (e) {
    console.warn('[Hotword] Voice.stop failed:', e);
  }

  try {
    await Voice.destroy();
  } catch (e) {
    console.warn('[Hotword] Voice.destroy failed:', e);
  }

  // 🔥 이벤트 핸들러 제거 (매우 중요)
  Voice.onSpeechResults = null;
  Voice.onSpeechError = null;

  console.log('[Hotword] fully stopped');
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
 * 🧪 Hotword 실행 여부 확인 (디버깅 / 테스트용)
 */
export const isHotwordRunning = () => isRunning;
