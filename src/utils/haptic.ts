/**
 * haptic.ts
 * ----------------------------
 * 안전한 진동 유틸 (RN 기본 API)
 */

import { Vibration, Platform } from 'react-native';

export function triggerVibration() {
  if (Platform.OS === 'android') {
    Vibration.vibrate(40);
  }
}
