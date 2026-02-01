import Voice from '@react-native-voice/voice';

let isListening = false;

export const startListening = (
  onResult: (text: string) => void,
  onError?: (e: any) => void,
) => {
  if (isListening) return;

  isListening = true;

  Voice.onSpeechResults = event => {
    const results = event.value ?? [];
    if (results.length > 0) {
      onResult(results[0]); // 가장 신뢰도 높은 문장
    }
  };

  Voice.onSpeechError = e => {
    onError?.(e);
    stopListening();
  };

  Voice.start('ko-KR').catch(e => {
    isListening = false;
    onError?.(e);
  });
};

export const stopListening = () => {
  if (!isListening) return;

  isListening = false;
  Voice.stop();
  Voice.destroy();

  Voice.onSpeechResults = null;
  Voice.onSpeechError = null;
};
