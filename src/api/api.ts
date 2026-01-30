/**
 * api.ts (🔥 REAL FINAL STABLE - NO AUTO LOGOUT)
 * --------------------------------------------------
 * 주요 기능 요약:
 * ✅ baseURL: .env → API_BASE_URL
 * ✅ auth/login, auth/register, auth/refresh → Authorization ❌
 * ✅ 그 외 요청 → Authorization 자동 주입
 * ✅ FormData 요청 시 Content-Type 제거
 * ✅ 앱 시작 시 accessToken 로딩 게이트 적용
 * ✅ 401 발생 시 refreshToken으로 accessToken 자동 재발급 (큐)
 * ✅ refreshToken invalid여도 로그아웃 ❌
 * ✅ 로그아웃은 오직 "사용자 버튼"으로만 발생
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';
import { logoutAndRedirect } from '../navigation/authActions';
import { Buffer } from 'buffer';

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
 * 🔎 JWT exp 파싱 (선제 refresh용)
 * - exp(초) → ms로 변환
 * - 파싱 실패 시 null
 * ================================================== */

const decodeJwtExpMs = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    // base64url → base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    // RN 환경에서 Buffer 사용 가능
    const json = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(json);

    if (typeof payload?.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

/* ==================================================
 * 🔒 TOKEN READY GATE
 * - 앱 시작 / 로그인 직후 경쟁상태 방지
 * ================================================== */

let tokenGateResolved = false;
let tokenGatePromise: Promise<void> | null = null;

/** 로그인/리프레시 성공 직후 호출 가능 */
export const markTokenReady = () => {
  tokenGateResolved = true;
};

/** 앱 시작 시 토큰 상태 1회 스캔 */
const ensureTokenGate = async () => {
  if (tokenGateResolved) return;

  if (!tokenGatePromise) {
    tokenGatePromise = (async () => {
      const access = await AsyncStorage.getItem('accessToken');
      if (access) {
        tokenGateResolved = true;
        return;
      }

      const refresh = await AsyncStorage.getItem('refreshToken');
      if (!refresh) {
        // 비로그인 상태
        tokenGateResolved = true;
        return;
      }

      // refreshToken만 있는 경우 → pre-refresh에서 처리
    })();
  }

  await tokenGatePromise;
};

/* ==================================================
 * 🔁 PRE-REFRESH
 * - accessToken 없고 refreshToken 있으면
 *   첫 요청 전에 조용히 1회 시도
 * ================================================== */

let preRefreshing = false;
let preRefreshPromise: Promise<void> | null = null;

const runPreRefreshIfNeeded = async () => {
  if (tokenGateResolved) {
    console.log('[PRE-REFRESH] skipped (tokenGateResolved)');
    return;
  }
  if (preRefreshing) {
    console.log('[PRE-REFRESH] already running, wait');
    return preRefreshPromise ?? undefined;
  }

  const refreshToken = await AsyncStorage.getItem('refreshToken');

  if (!refreshToken) {
    console.log('[PRE-REFRESH] no refreshToken');
    tokenGateResolved = true;
    return;
  }

  const accessToken = await AsyncStorage.getItem('accessToken');
  if (accessToken) {
    console.log('[PRE-REFRESH] accessToken already exists');
    tokenGateResolved = true;
    return;
  }

  console.warn('[PRE-REFRESH] start');

  preRefreshing = true;
  preRefreshPromise = (async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = res.data?.accessToken;
      if (newAccessToken) {
        await AsyncStorage.setItem('accessToken', newAccessToken);
        tokenGateResolved = true;
        console.log('[PRE-REFRESH] success, new accessToken saved');
      } else {
        console.warn('[PRE-REFRESH] response has no accessToken');
      }
    } catch (e: any) {
      console.warn('[PRE-REFRESH] failed', e?.response?.status);
      // ❌ 실패해도 로그아웃 금지
      // 이후 요청에서 다시 시도됨
    } finally {
      preRefreshing = false;
      console.log('[PRE-REFRESH] end');
    }
  })();

  await preRefreshPromise;
};

/* ================= Request Interceptor ================= */

api.interceptors.request.use(
  async config => {
    const url = config.url ?? '';

    const currentToken = await AsyncStorage.getItem('accessToken');

    if (currentToken) {
      const expMs = decodeJwtExpMs(currentToken);
      const now = Date.now();
      const expInSec =
        expMs !== null ? Math.floor((expMs - now) / 1000) : 'unknown';

      console.log(`[REQ] ${url} | token exp in: ${expInSec}s`);
    } else {
      console.log(`[REQ] ${url} | NO accessToken`);
    }

    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    // RN FormData 안전 처리
    const isFormData =
      typeof config.data === 'object' &&
      config.data !== null &&
      typeof (config.data as any).append === 'function';

    if (isFormData) {
      delete config.headers?.['Content-Type'];
    }

    if (!isAuthRequest) {
      await ensureTokenGate();

      if (!tokenGateResolved) {
        console.log('[REQ] tokenGate not resolved, try pre-refresh');
        await runPreRefreshIfNeeded();
      }

      const token = await AsyncStorage.getItem('accessToken');

      if (token) {
        const expMs = decodeJwtExpMs(token);
        const now = Date.now();

        const shouldPreemptiveRefresh = expMs !== null && expMs - now <= 60_000;

        if (shouldPreemptiveRefresh) {
          console.warn(`[PREEMPTIVE] ${url} token expiring soon, try refresh`);

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const newAccessToken = res.data?.accessToken;
              if (newAccessToken) {
                await AsyncStorage.setItem('accessToken', newAccessToken);
                tokenGateResolved = true;

                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${newAccessToken}`;

                console.log('[PREEMPTIVE] refresh success, use new token');
                return config;
              }
            }
          } catch (e: any) {
            console.warn(
              '[PREEMPTIVE] refresh failed, fallback to response interceptor',
              e?.response?.status,
            );
            // ❌ 여기서 로그아웃 금지
            // → response interceptor에서 최종 처리
          }
        }

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
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  console.log('[QUEUE] processQueue', error ? 'with error' : 'success');

  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

/* ================= Response Interceptor (🔥 REAL FINAL) ================= */

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const url = originalRequest?.url;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    console.warn(`[401] ${url}`);

    // ===============================
    // 🔁 이미 refresh 중이면 큐 대기
    // ===============================
    if (isRefreshing) {
      console.log(`[QUEUE] ${url} waiting for refresh`);
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: token => {
            if (!token) {
              reject(error);
              return;
            }

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            console.log(`[RETRY] ${url} (from queue)`);
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

      if (!refreshToken) {
        console.warn('[REFRESH] no refreshToken');
        processQueue(error, null);
        return Promise.reject(error);
      }

      console.warn('[REFRESH] start');

      const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken = res.data?.accessToken;
      if (!newAccessToken) throw new Error('NO_NEW_ACCESS_TOKEN');

      await AsyncStorage.setItem('accessToken', newAccessToken);
      tokenGateResolved = true;

      console.log('[REFRESH] success, new accessToken saved');

      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      console.log(`[RETRY] ${url}`);
      return api(originalRequest);
    } catch (refreshError: any) {
      console.error('[REFRESH] failed', refreshError?.response?.status);

      processQueue(refreshError, null);

      const status = refreshError?.response?.status;

      if (status === 401 || status === 403) {
        console.error('[REFRESH] refreshToken invalid → logout');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        logoutAndRedirect();
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
      console.log('[REFRESH] end');
    }
  },
);
