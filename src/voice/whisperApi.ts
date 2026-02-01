// src/voice/whisperApi.ts
/**
 * whisperApi.ts
 * --------------------------------------------------
 * - Whisper STT 프록시(Node)로 음성 파일 업로드
 * - multipart/form-data로 'file' 필드 전송
 * - 실패 시에도 앱 동작에 영향 없도록 기본값 반환
 */
import axios from 'axios';

const WHISPER_URL = 'https://viewlulu.site/stt/whisper';

export type WhisperResult = {
  text: string;
  contains_chalkak: boolean;
};

const DEFAULT_RESULT: WhisperResult = { text: '', contains_chalkak: false };

// src/voice/whisperApi.ts
/**
 * whisperApi.ts (FINAL FIX)
 * --------------------------------------------------
 * - RN → Node Whisper STT 업로드
 * - axios ❌ fetch ⭕ (RN multipart 안정성)
 */

export async function sendToWhisper(wavPath: string): Promise<WhisperResult> {
  try {
    console.log('[WHISPER] sendToWhisper called', wavPath);

    const formData = new FormData();

    const normalizedUri = wavPath.startsWith('file://')
      ? wavPath
      : `file://${wavPath}`;

    formData.append('file', {
      uri: normalizedUri,
      name: 'record.wav',
      type: 'audio/wav',
    } as any);

    const res = await fetch(WHISPER_URL, {
      method: 'POST',
      body: formData,
      // ❗ headers 절대 수동 지정하지 말 것
    });

    const data = await res.json();

    console.log('[WHISPER] response', data);

    return {
      text: typeof data.text === 'string' ? data.text : '',
      contains_chalkak: Boolean(data.contains_chalkak),
    };
  } catch (e: any) {
    console.warn('[WHISPER] failed:', e?.message ?? e);
    return { text: '', contains_chalkak: false };
  }
}
