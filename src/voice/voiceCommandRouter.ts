/**
 * voiceCommandRouter.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * - "뷰루루" 이후 음성 명령을 해석하여 행동으로 변환
 * - STT / Whisper / 음성 엔진 독립
 *
 * 책임:
 * - 음성 명령 Intent 분류
 * - 안전한 기본 응답 처리
 * - Navigation / TTS 연결
 *
 * ❗ UI 없음
 * ❗ 화면 로직 없음
 */

import { speak } from './tts';
import { navigationRef } from '../navigation/navigationRef';

/* ================= Types ================= */

export type VoiceContext = 'HOME';

type VoiceCommandHandler = () => void;

/* ================= Intent Dictionary ================= */

const COMMANDS: {
  keywords: string[];
  handler: VoiceCommandHandler;
}[] = [
  {
    keywords: ['화장품', '인식', '촬영'],
    handler: () => {
      speak('화장품 인식을 시작할게요.');
      navigationRef.navigate('CaptureStack', {
        screen: 'CosmeticDetect',
      });
    },
  },
  {
    keywords: ['파우치', '내 화장품', '목록'],
    handler: () => {
      speak('내 파우치로 이동할게요.');
      navigationRef.navigate('MainTabs', {
        screen: 'MyPouchTab',
      });
    },
  },
  {
    keywords: ['최근', '분석', '결과'],
    handler: () => {
      speak('최근 분석 결과를 보여드릴게요.');
      navigationRef.navigate('FeatureStack', {
        screen: 'RecentResult',
      });
    },
  },
  {
    keywords: ['얼굴', '얼굴형'],
    handler: () => {
      speak('얼굴형 분석을 시작할게요.');
      navigationRef.navigate('FeatureStack', {
        screen: 'FaceAnalysis',
      });
    },
  },
];

/* ================= Utils ================= */

const normalize = (text: string) =>
  text.replace(/\s+/g, '').toLowerCase();

/* ================= Public API ================= */

/**
 * 🎤 음성 명령 라우팅
 * @param text STT 결과 텍스트
 * @param context 현재 화면 컨텍스트 (지금은 HOME만)
 */
export function routeVoiceCommand(
  text: string,
  context: VoiceContext
) {
  if (!text || context !== 'HOME') return;

  const normalized = normalize(text);

  for (const cmd of COMMANDS) {
    if (cmd.keywords.some(k => normalized.includes(k))) {
      cmd.handler();
      return;
    }
  }

  // ❓ 매칭 실패 (안전 응답)
  speak('무슨 말인지 잘 모르겠어요. 다시 말씀해 주세요.');
}
