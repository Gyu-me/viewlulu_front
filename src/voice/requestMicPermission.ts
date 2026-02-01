/**
 * 📁 requestMicPermission.ts
 * --------------------------------------------------
 * 🎤 마이크 권한 요청 (공통)
 *
 * - STT 시작 전 1회 호출
 * - 카메라 화면에서만 사용 권장
 */

import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestMicPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) return true;

      Alert.alert(
        '마이크 권한 필요',
        '음성 촬영을 위해 마이크 권한이 필요합니다.',
      );
      return false;
    }

    // iOS
    const result = await request(PERMISSIONS.IOS.MICROPHONE);
    if (result === RESULTS.GRANTED) return true;

    Alert.alert(
      '마이크 권한 필요',
      '음성 촬영을 위해 마이크 권한이 필요합니다.',
    );
    return false;
  } catch (e) {
    console.warn('[requestMicPermission] error', e);
    return false;
  }
};
