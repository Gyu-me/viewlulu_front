/**
 * auth.api.ts (🔥 FINAL CONFIRMED)
 * --------------------------------------------------
 * ✅ api.ts 인스턴스 사용
 *    - baseURL = https://viewlulu.site
 * ✅ 로그인 / 회원가입 서버 curl 테스트와 완전 동일
 * ✅ Authorization 인터셉터 사용 ❌ (로그인은 토큰 불필요)
 * ✅ detect / cosmetics API와 경로 체계 완전 통일
 */

import { api } from './api';

/* ================= Types ================= */

/**
 * 공통 사용자 타입
 */
export type AuthUser = {
  id: number;
  email: string;
  name: string;
  age?: number;
  gender?: '남' | '여';
};

/**
 * 로그인 응답 (🔥 access + refresh)
 */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

/**
 * 회원가입 요청
 * ⚠️ 백엔드 스펙과 1:1 일치
 */
export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: '남' | '여';
};

/**
 * 회원가입 응답
 */
export type RegisterResponse = AuthUser;

/* ================= API ================= */

/**
 * 로그인
 * POST /auth/login
 */
export const loginApi = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });

  return res.data;
};

/**
 * 회원가입
 * POST /auth/register
 */
export const registerApi = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  const res = await api.post<RegisterResponse>('/auth/register', {
    name: data.name,
    email: data.email,
    password: data.password,
    age: data.age,
    gender: data.gender,
  });

  return res.data;
};
