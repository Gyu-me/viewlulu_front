/**
 * whisperRecorder.ts
 * --------------------------------------------------
 * - react-native-audio-recorder-player 기반 Whisper STT 녹음 컨트롤
 * - Android MediaRecorder IllegalStateException 완전 방지
 * - recorder 인스턴스 재사용 금지 (깨지면 즉시 폐기)
 * - stop → Whisper 전송 → 항상 상태 복구
 * - 실패해도 앱 동작에 영향 없음 (null 안전)
 */

import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { PermissionsAndroid, Platform } from 'react-native';
import { sendToWhisper, WhisperResult } from './whisperApi';

/* ================= Internal State ================= */

let recorder: AudioRecorderPlayer | null = null;
let isRecording = false;
let recordingPath: string | null = null;
let stopping = false;

/**
 * Android MediaRecorder 안정화 쿨다운
 * - stop → start 사이 필수
 */
const RECORD_COOLDOWN_MS = 400;

/* ================= Utils ================= */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.warn('[WHISPER] mic permission error', e);
    return false;
  }
}

/* ================= Recorder Factory ================= */

function createRecorder() {
  recorder = new AudioRecorderPlayer();
}

/* ================= Start Recording ================= */

/**
 * 🎙 Whisper STT 녹음 시작
 * - 이미 녹음 중 / stop 중이면 무시
 * - 항상 새 recorder 인스턴스 사용
 */
export async function startWhisperRecording(): Promise<boolean> {
  if (isRecording || stopping) {
    console.log('[WHISPER] start ignored (busy)');
    return false;
  }

  const ok = await requestMicPermission();
  if (!ok) return false;

  try {
    createRecorder(); // 🔥 항상 새 인스턴스

    isRecording = true;

    const path = Platform.select({
      ios: 'record.wav', // iOS: 파일명만
      android: undefined, // Android: 내부 cache 자동
    });

    recordingPath = await recorder!.startRecorder(path);
    console.log('[WHISPER] recording started', recordingPath);
    return true;
  } catch (e) {
    console.warn('[WHISPER] startRecorder failed', e);
    cleanup();
    return false;
  }
}

/* ================= Stop Recording ================= */

/**
 * 🛑 녹음 종료 + Whisper STT 전송
 * - 중복 stop / 잘못된 상태 호출 방지
 * - 어떤 경우에도 cleanup에서 상태 완전 복구
 */
export async function stopWhisperRecording(): Promise<WhisperResult | null> {
  if (!isRecording || !recordingPath || stopping || !recorder) {
    console.log('[WHISPER] stop ignored (not recording)');
    return null;
  }

  stopping = true;
  const pathToSend = recordingPath;

  try {
    console.log('[WHISPER] stopping recorder');
    await recorder.stopRecorder();

    // 🔥 MediaRecorder 안정화 쿨다운
    await sleep(RECORD_COOLDOWN_MS);

    const result = await sendToWhisper(pathToSend);
    console.log('[WHISPER] recognized', result);
    return result;
  } catch (e) {
    console.warn('[WHISPER] stopRecorder/send failed', e);
    return null;
  } finally {
    cleanup(); // 🔥 무조건 폐기
  }
}

/* ================= Cleanup ================= */

/**
 * 내부 상태 완전 초기화
 * - recorder 인스턴스 폐기
 * - 어떤 에러가 나도 다음 시도에 영향 없음
 */
function cleanup() {
  recorder = null;
  isRecording = false;
  recordingPath = null;
  stopping = false;
}
