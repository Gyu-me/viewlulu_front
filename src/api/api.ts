/**
 * api.ts (🔥 REAL FINAL STABLE)
 * --------------------------------------------------
 * ✅ baseURL: .env → API_BASE_URL
 * ✅ auth/login, auth/register → Authorization ❌
 * ✅ 그 외 요청 → Authorization 자동 주입
 * ✅ FormData 요청 시 Content-Type 제거
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
      url.includes('/auth/register');

    // 🔥 로그인 / 회원가입 → Authorization 절대 금지
    if (isAuthRequest) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    } else {
      // 🔥 나머지 API → 토큰 자동 주입
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
