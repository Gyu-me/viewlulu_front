/**
 * 인증 API
 * - 로그인
 */

import { api } from './client';

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
};

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
