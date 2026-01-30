/**
 * useAppForegroundAuth (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * 📌 역할:
 * - 앱이 background → foreground 로 전환될 때
 * - accessToken이 없는 경우에만
 * - refreshToken을 사용해 "조용히" accessToken 복구
 *
 * ❗ 중요 설계 원칙:
 * - ❌ 여기서 로그아웃 절대 하지 않음
 * - ❌ 인증 유효성 판단하지 않음
 * - ❌ UI / Navigation 변경 절대 없음
 *
 * ✅ 실제 인증 판단:
 * - api.ts response interceptor가 단일 책임으로 처리
 *
 * ✅ 효과:
 * - 장시간 대기 후 복귀 시 첫 요청부터 안정화
 * - “가만히 뒀다가 다시 쓰면 먹통” 현상 제거
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

export const useAppForegroundAuth = () => {
  // 이전 AppState 저장 (ref로 유지)
  const prevState = useRef<AppStateStatus>(AppState.currentState);

  // 중복 refresh 방지용 락
  const isRefreshing = useRef(false);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async nextState => {
      const wasBackground =
        prevState.current === 'inactive' || prevState.current === 'background';

      // 🔔 background → foreground 전환 시점만 처리
      if (wasBackground && nextState === 'active') {
        // 이미 refresh 중이면 아무것도 하지 않음
        if (isRefreshing.current) {
          prevState.current = nextState;
          return;
        }

        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        // 🔴 로그인 상태 아님 → 무시
        if (!refreshToken) {
          prevState.current = nextState;
          return;
        }

        // 🟢 accessToken이 있으면 건드리지 않음
        if (accessToken) {
          prevState.current = nextState;
          return;
        }

        // 🟡 accessToken 없음 + refreshToken 있음 → 조용히 복구 시도
        try {
          isRefreshing.current = true;

          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const newAccessToken = res.data?.accessToken;

          if (newAccessToken) {
            await AsyncStorage.setItem('accessToken', newAccessToken);
          }
          // ❗ 실패해도 여기서는 아무 처리 안 함
          // → 이후 실제 요청에서 api.ts가 판단
        } catch {
          // ❌ 여기서 로그아웃 절대 금지
          // ❌ 에러 표시 / 네비게이션 변경 금지
        } finally {
          isRefreshing.current = false;
        }
      }

      prevState.current = nextState;
    });

    return () => {
      sub.remove();
    };
  }, []);
};
