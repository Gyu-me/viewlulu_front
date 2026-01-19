/**
 * cosmetic.api.ts (🔥 최종 확정본)
 * --------------------------------------------------
 * ✅ 기존 API 전부 유지
 * ✅ Detect는 Node API 경유
 * ✅ FormData 안전 처리
 * ❌ Content-Type 수동 지정 완전 제거
 * ❌ axios 직접 사용 제거 (api.ts만 사용)
 */

import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================= 공통 타입 ================= */

export type DetectCosmeticResponse = {
  detectedId: number;
};

/* =================================================
 * 🔥 화장품 인식 (Node API)
 * ================================================= */

export const detectCosmeticApi = async (photo: {
  uri: string;
  name: string;
  type: string;
}): Promise<DetectCosmeticResponse> => {
  const formData = new FormData();

  formData.append('photo', {
    uri: photo.uri,
    name: photo.name,
    type: photo.type,
  } as any);

  const res = await api.post('/cosmetics/detect', formData);

  if (!res.data?.detectedId) {
    throw new Error('Detect failed: empty detectedId');
  }

  return {
    detectedId: Number(res.data.detectedId),
  };
};

/* ================= 내 화장품 목록 (MyPouch) ================= */

export type CosmeticGroupItem = {
  groupId: number;
  cosmeticName: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

export const getMyCosmeticsApi = async (): Promise<CosmeticGroupItem[]> => {
  const res = await api.get('/cosmetics/me');
  return res.data;
};

/* ================= 화장품 상세 ================= */

export type CosmeticDetail = {
  cosmeticId: number;
  cosmeticName: string;
  createdAt: string;
  photos: {
    s3Key: string;
    originalName: string;
    mimeType: string;
  }[];
};

export const getCosmeticDetailApi = async (
  cosmeticId: number,
): Promise<CosmeticDetail> => {
  const res = await api.get(`/cosmetics/${cosmeticId}`);
  return res.data;
};

/* ================= 단일 업로드 (절대 유지) ================= */

export const uploadCosmeticApi = async (photo: {
  uri: string;
  name: string;
  type: string;
}) => {
  const formData = new FormData();

  formData.append('photo', {
    uri: photo.uri,
    name: photo.name,
    type: photo.type,
  } as any);

  const res = await api.post('/cosmetics', formData);
  return res.data;
};

/* ================= bulk 업로드 (4장 저장) ================= */

export const createCosmeticApi = async ({
  name,
  images,
}: {
  name: string;
  images: string[];
}) => {
  const formData = new FormData();
  formData.append('name', name.trim());

  images.forEach((uri, index) => {
    formData.append('photos', {
      uri,
      name: `cosmetic_${index + 1}.jpg`,
      type: 'image/jpeg',
    } as any);
  });

  const token = await AsyncStorage.getItem('accessToken');

  const res = await fetch('http://viewlulu.site:3000/cosmetics/bulk', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // ❗ Content-Type 절대 지정 ❌
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[createCosmeticApi] failed', res.status, text);
    throw new Error(text);
  }

  return res.json();
};
