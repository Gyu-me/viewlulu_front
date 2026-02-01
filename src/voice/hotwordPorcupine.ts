import { PorcupineManager } from '@picovoice/porcupine-react-native';
import { Platform } from 'react-native';

const ACCESS_KEY = 'XsUA8FGIuXuFkOzZf2Rrc5/oSBIWdpJcS7ggroOPiRTu+/VG6e1eVg=='; // ← 나중에 env로

let porcupine: PorcupineManager | null = null;
let isRunning = false;

type WakeCallback = () => void;

export async function startHotword(onWake: WakeCallback) {
  if (isRunning) return;

  porcupine = await PorcupineManager.fromKeywordPaths(
    ACCESS_KEY,
    [
      Platform.OS === 'android'
        ? 'porcupine/viewlulu_android.ppn'
        : 'viewlulu_ios.ppn',
    ],
    keywordIndex => {
      console.log('[Hotword] viewlulu detected!', keywordIndex);
      onWake();
    },
  );

  await porcupine.start();
  isRunning = true;

  console.log('[Hotword] porcupine started');
}

export async function stopHotword() {
  if (!porcupine || !isRunning) return;

  await porcupine.stop();
  await porcupine.delete();

  porcupine = null;
  isRunning = false;

  console.log('[Hotword] porcupine stopped');
}
