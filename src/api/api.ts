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

    // 🔥 로그인 / 회원가입 / refresh → Authorization 절대 금지
    if (isAuthRequest) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    } else {
      // 🔥 나머지 API → accessToken 자동 주입
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // ✅ multipart/form-data일 경우 Content-Type 제거
    if (config.data instanceof FormData) {
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

    // ❌ accessToken 만료가 아니면 그대로 throw
    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // 🔁 refresh 중이면 대기열에 넣기
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

      // 🔄 refresh API 호출
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = res.data.accessToken;

      // ✅ 새 accessToken 저장
      await AsyncStorage.setItem('accessToken', newAccessToken);

      // ✅ 대기 요청들 재시도
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // ❗ 여기서만 로그아웃 처리 (refreshToken도 invalid)
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'user',
      ]);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
