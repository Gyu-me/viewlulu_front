import Tts from 'react-native-tts';
import { AppState } from 'react-native';

let ttsReady = false;
let isAppActive = true; // 🔥 핵심 플래그

/**
 * 앱 시작 시 한 번 호출
 */
export async function initTTS() {
  try {
    await Tts.setDefaultLanguage('ko-KR');
    await Tts.setDefaultRate(0.75, true);
    await Tts.setDefaultPitch(1.0);
    ttsReady = true;

    // 🔥 AppState 감시
    AppState.addEventListener('change', state => {
      isAppActive = state === 'active';

      if (!isAppActive) {
        Tts.stop(); // 앱 나가는 즉시 무조건 중단
      }
    });
  } catch (e) {
    ttsReady = false;
  }
}

/** 🔥 추가: 음성 속도 변경 */
export function initTts() {
  Tts.setDefaultLanguage('ko-KR');

  // 🔥 속도 조절 (추천)
  Tts.setDefaultRate(0.88, true);

  // 선택: 음높이
  Tts.setDefaultPitch(1.0);
}

/**
 * 음성 출력
 */
export function speak(text: string) {
  if (!ttsReady || !text) return;

  // 🚫 앱이 active 아닐 땐 절대 말 안 함
  if (!isAppActive) return;

  Tts.stop();
  Tts.speak(text);
}

/**
 * 화면 설명 전용
 */
export function announceScreen(title?: string, guide?: string) {
  const parts: string[] = [];

  if (title && title.trim().length > 0) {
    parts.push(title.trim());
  }

  if (guide && guide.trim().length > 0) {
    parts.push(guide.trim());
  }

  const message = parts.join(' ');
  speak(message);
}

/**
 * 강제 중단
 */
export function stopTts() {
  Tts.stop();
}
