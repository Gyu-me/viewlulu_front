/**
 * api.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * ✅ baseURL: .env → API_BASE_URL
 * ✅ auth/login, auth/register, auth/refresh → Authorization ❌
 * ✅ 그 외 요청 → Authorization 자동 주입
 * ✅ FormData 요청 시 Content-Type 제거
 * ✅ 앱 시작 시 accessToken 로딩 큐 적용
 * ✅ 401 발생 시 refreshToken으로 accessToken 자동 재발급 (큐)
 * ✅ refreshToken invalid(401/403)일 때만 로그아웃
 * ✅ 사용자는 절대 로그아웃 체감 ❌
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutAndRedirect } from '../navigation/authActions';
import { API_BASE_URL } from '@env';

/* ================= Env Check ================= */

console.log('🔥 API_BASE_URL:', API_BASE_URL);

if (!API_BASE_URL) {
  throw new Error('[api] API_BASE_URL is undefined.');
}

/* ================= Axios Instance ================= */

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

/* ==================================================
 * 🔒 TOKEN READY GATE (앱 시작 / 로그인 직후 경쟁상태 방지)
 * - "스토리지 한번 읽음"이 아니라
 *   "토큰을 붙일 수 있는 상태"가 되었음을 의미
 * ================================================== */

let tokenGateResolved = false;
let tokenGatePromise: Promise<void> | null = null;

/** 토큰 게이트를 열어줌 (로그인/리프레시 성공 직후 호출 가능) */
export const markTokenReady = () => {
  tokenGateResolved = true;
};

/** 앱 시작 시 토큰 상태를 한 번만 스캔 */
const ensureTokenGate = async () => {
  if (tokenGateResolved) return;

  if (!tokenGatePromise) {
    tokenGatePromise = (async () => {
      // accessToken이 있으면 즉시 ready
      const access = await AsyncStorage.getItem('accessToken');
      if (access) {
        tokenGateResolved = true;
        return;
      }

      // accessToken이 없으면 refreshToken 확인까지만 하고,
      // (필요 시) pre-refresh가 request interceptor에서 1회 수행됨
      const refresh = await AsyncStorage.getItem('refreshToken');
      if (!refresh) {
        // refreshToken도 없으면 더 대기할 이유가 없음 (비로그인)
        tokenGateResolved = true;
        return;
      }

      // refreshToken은 있는데 accessToken이 없는 상태:
      // 여기서는 "gate를 열지 않고" 대기 상태 유지.
      // 실제 refresh는 아래 pre-refresh 로직에서 수행.
    })();
  }

  await tokenGatePromise;
};

/* ==================================================
 * 🔁 PRE-REFRESH (앱 시작 직후 첫 요청에서 401 방지)
 * - accessToken이 없고 refreshToken이 있으면
 *   요청을 보내기 전에 1회 조용히 refresh 시도
 * - 성공하면 accessToken 저장 + gate open
 * - 실패해도 네 설계(로그아웃 체감 ❌) 유지
 * ================================================== */

let preRefreshing = false;
let preRefreshPromise: Promise<void> | null = null;

const runPreRefreshIfNeeded = async () => {
  // 이미 준비됐거나, 이미 refresh 중이면 그대로 대기
  if (tokenGateResolved) return;
  if (preRefreshing) return preRefreshPromise ?? undefined;

  const refreshToken = await AsyncStorage.getItem('refreshToken');

  // 🔴 refreshToken 자체가 없으면 비로그인 상태
  // → gate를 열어도 됨 (어차피 Authorization 붙일 수 없음)
  if (!refreshToken) {
    tokenGateResolved = true;
    return;
  }

  const accessToken = await AsyncStorage.getItem('accessToken');

  // 🟢 accessToken이 이미 있으면 즉시 gate open
  if (accessToken) {
    tokenGateResolved = true;
    return;
  }

  // 🟡 refreshToken은 있고 accessToken은 없는 상태 → pre-refresh 시도
  preRefreshing = true;
  preRefreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = res.data?.accessToken;

      if (newAccessToken) {
        await AsyncStorage.setItem('accessToken', newAccessToken);

        // ✅ 오직 accessToken 확보 시에만 gate open
        tokenGateResolved = true;
        return;
      }

      // ❗ accessToken을 못 받았으면 gate는 열지 않음
      // 이후 요청은 response interceptor에서 401 처리
    } catch (e: any) {
      const status = e?.response?.status;

      // ❗ refreshToken이 명확히 invalid한 경우만 정리
      if (status === 401 || status === 403) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }

      // ❌ gate open 하지 않음
    } finally {
      preRefreshing = false;
    }
  })();

  await preRefreshPromise;
};

/* ================= Request Interceptor ================= */

api.interceptors.request.use(
  async config => {
    const url = config.url ?? '';

    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    // 🔥 RN FormData 안전 처리
    const isFormData =
      typeof config.data === 'object' &&
      config.data !== null &&
      typeof (config.data as any).append === 'function';

    if (isFormData) {
      delete config.headers?.['Content-Type'];
    }

    if (!isAuthRequest) {
      // 1) 앱 시작 시 토큰 상태 스캔
      await ensureTokenGate();

      // 2) accessToken이 없고 refreshToken이 있으면
      //    첫 요청에서 조용히 refresh 1회 시도
      if (!tokenGateResolved) {
        await runPreRefreshIfNeeded();
      }

      // 3) 최종적으로 accessToken이 있으면 붙이기
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  error => Promise.reject(error),
);

/* ==================================================
 * 🔁 REFRESH QUEUE (401 동시 요청 방지)
 * ================================================== */

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) promise.reject(error);
    else if (token) promise.resolve(token);
  });
  failedQueue = [];
};

/* ================= Response Interceptor ================= */

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 🔁 이미 refresh 중이면 큐에 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = res.data?.accessToken;
      if (!newAccessToken) throw new Error('NO_NEW_ACCESS_TOKEN');

      await AsyncStorage.setItem('accessToken', newAccessToken);

      // ✅ 토큰 준비 완료 게이트 오픈
      tokenGateResolved = true;

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);

      const status = refreshError?.response?.status;

      // ❗ 명확히 invalid일 때만 로그아웃
      if (status === 401 || status === 403) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
