// App.tsx
// 앱의 진입점 (NavigationContainer 포함)

import { AppState } from 'react-native';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { initTTS, stopTts } from './src/voice/tts';
import { navigationRef } from './src/navigation/navigationRef';


export default function App() {
  useEffect(() => {
    initTTS();

      const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        stopTts(); // ✅ 앱 나가면 무조건 음성 중단
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
          ref={navigationRef}
          onStateChange={() => {
            stopTts(); // 🔥 화면이 바뀌는 모든 순간에 TTS 중단
          }}
    >
      <RootNavigator />
    </NavigationContainer>
  );
}
