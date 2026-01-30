/**
 * authActions.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * - 인증 상태 변경을 UI에 알리는 단일 책임 모듈
 * - api.ts / UI 어디서든 호출 가능
 * - Navigation 직접 조작 ❌
 * - 오직 "상태 변화 이벤트"만 발행
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitAuthChanged } from './authEvents';

/**
 * 🔥 로그아웃 + UI 동기화
 * - 토큰 정리
 * - RootNavigator에게 상태 변경 알림
 */
export const logoutAndRedirect = async () => {
  try {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  } finally {
    // 🔥 무조건 호출 (성공/실패 상관없이)
    emitAuthChanged();
  }
};
