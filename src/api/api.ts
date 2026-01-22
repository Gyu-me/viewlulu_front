/**
 * api.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * ✅ baseURL: .env → API_BASE_URL
 * ✅ auth/login, auth/register → Authorization ❌
 * ✅ 그 외 요청 → Authorization 자동 주입
 * ✅ FormData 요청 시 Content-Type 제거
 * ✅ 401 발생 시 refreshToken으로 accessToken 자동 재발급
 * ✅ 사용자는 절대 로그아웃 체감 ❌
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

/* ================= Env Check ================= */

console.log('🔥 API_BASE_URL:', API_BASE_URL);

if (!API_BASE_URL) {
  throw new Error('[api] API_BASE_URL is undefined. Check .env & babel config.');
}




/* ================= Axios Instance ================= */

export const api = axios.create({
  baseURL: API_BASE_URL, // 예: https://viewlulu.site/api
  timeout: 20_000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// 디버깅 로그
console.log('🔥 AXIOS_LIMITS:', {
  maxBodyLength: (api.defaults as any).maxBodyLength,
  maxContentLength: (api.defaults as any).maxContentLength,
});

/* ================= Request Interceptor ================= */

api.interceptors.request.use(
  async config => {
    const url = config.url ?? '';

    const isAuthRequest =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (!isAuthRequest) {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 🔥 RN 안전 FormData 판별
    const isFormData =
      typeof config.data === 'object' &&
      config.data !== null &&
      typeof (config.data as any).append === 'function';

    if (isFormData) {
      delete config.headers?.['Content-Type'];
    }

    return config;
  },
  error => Promise.reject(error),
);


/* ================= Response Interceptor ================= */

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

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
      if (!refreshToken) {
        throw new Error('NO_REFRESH_TOKEN');
      }

      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = res.data.accessToken;

      await AsyncStorage.setItem('accessToken', newAccessToken);

      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);

      /**
       * 🔥 여기만 변경
       * - refreshToken이 "명확히 invalid"일 때만 로그아웃
       */
      const status = refreshError?.response?.status;

      if (status === 401 || status === 403) {
        await AsyncStorage.multiRemove([
          'accessToken',
          'refreshToken',
          'user',
        ]);
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

