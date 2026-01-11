/**

axios 공통 클라이언트
baseURL: .env의 API_BASE_URL
Authorization 헤더 자동 주입
*/

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = Bearer ${token};
    }

    return config;
  },
  error => Promise.reject(error),
);