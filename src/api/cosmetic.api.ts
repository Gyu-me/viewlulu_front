/**
 * Cosmetic API (최종본)
 * --------------------------------------------------
 * - 화장품 인식(Detect)
 * - 내 화장품 목록 조회
 */

import { api } from './client';

export type DetectCosmeticResponse = {
  detectedId: string;
};

export type CosmeticItem = {
  id: number;
  s3_key: string;
  created_at: string;
};

export const detectCosmeticApi = async (
  photo: {
    uri: string;
    name: string;
    type: string;
  }
): Promise<DetectCosmeticResponse> => {
  const formData = new FormData();
  formData.append('photo', photo as any);

  const res = await api.post('/cosmetics/detect', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

export const getMyCosmeticsApi = async (): Promise<CosmeticItem[]> => {
  const res = await api.get('/cosmetics/me');
  return res.data;
};

/**
 * 단일 화장품 상세 조회
 * - detectedId 기반
 */
export type CosmeticDetail = {
  id: number;
  name: string;
  brand?: string;
  s3_key: string;
  created_at: string;
};

export const getCosmeticDetailApi = async (
  cosmeticId: string
): Promise<CosmeticDetail> => {
  const res = await api.get(`/cosmetics/${cosmeticId}`);
  return res.data;
};

/**
 * 화장품 등록 (4장 업로드)
 */

export const uploadCosmeticApi = async (
  photo: {
    uri: string;
    name: string;
    type: string;
  }
) => {
  const formData = new FormData();
  formData.append('photo', photo as any);

  const res = await api.post('/cosmetics', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};
