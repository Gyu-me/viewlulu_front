/**
 * 📁 cameraVoice.ts
 * --------------------------------------------------
 * 카메라 화면 전용 STT 컨트롤러 (FINAL STABLE - UPDATED)
 *
 * ✅ 특징:
 * - 중복 트리거 방지(locked)
 * - start/stop 안전
 * - stop 시 destroy 남발 방지(기기별 start 실패 예방)
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

/* ================= Internal State ================= */

let isRunning = false;
let locked = false;
let triggerCallback: (() => void) | null = null;

/* ================= Utils ================= */

const normalize = (text: string) => text.replace(/\s/g, '').toLowerCase();

/* ================= Handlers ================= */

const onSpeechResults = (e: SpeechResultsEvent) => {
  if (!e.value || locked) return;

  for (const raw of e.value) {
    const text = normalize(raw);

    if (text.includes('찰칵') || text.includes('찰깍')) {
      if (!triggerCallback) return;

      locked = true;
      triggerCallback?.();

      setTimeout(() => {
        locked = false;
      }, 1200);

      break;
    }
  }
};

const onSpeechError = (_e: SpeechErrorEvent) => {
  // 카메라 UX 우선: 에러는 조용히 무시
};

/* ================= Public API ================= */

export const startCameraVoice = async (onTrigger: () => void) => {
  if (isRunning) return;

  console.log('[STT] startCameraVoice called');

  triggerCallback = onTrigger;
  locked = false;

  Voice.onSpeechResults = e => {
    console.log('[STT] results raw', e.value);
    onSpeechResults(e);
  };

  Voice.onSpeechError = e => {
    console.log('[STT] error', e);
  };

  try {
    await Voice.start('ko-KR');
    console.log('[STT] Voice.start success');
    isRunning = true;
  } catch (e) {
    console.log('[STT] Voice.start failed', e);
    isRunning = false;
    triggerCallback = null;
  }
};

export const stopCameraVoice = async () => {
  if (!isRunning) return;

  try {
    // ✅ stop/cancel까지만 기본으로
    await Voice.stop();
    await Voice.cancel();
  } catch {
    // ignore
  } finally {
    Voice.onSpeechResults = undefined;
    Voice.onSpeechError = undefined;

    isRunning = false;
    locked = false;
    triggerCallback = null;
  }
};
