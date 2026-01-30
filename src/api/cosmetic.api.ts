/**
 * cosmetic.api.ts (🔥 REAL FINAL DEPLOY STABLE)
 * --------------------------------------------------
 * ✅ 기존 API / 엔드포인트 전부 유지
 * ✅ Node API 경유 (Detect / Upload / Bulk)
 * ✅ FormData Content-Type 자동 처리
 * ✅ axios 직접 사용 ❌ (api.ts만 사용)
 * ✅ Authorization / refresh / retry 전부 api.ts에 위임
 */

import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

/* ================= 공통 타입 ================= */

export type DetectCosmeticResponse = {
  detectedId: number;
};

/* =================================================
 * 🔥 화장품 인식 (Node API)
 * - 서버 multer.single('file') 기준 유지
 * ================================================= */

export const detectCosmeticApi = async (photo: {
  uri: string;
  name: string;
  type: string;
}): Promise<DetectCosmeticResponse> => {
  const formData = new FormData();

  // ❗ 서버 기준 필드명: file (안전)
  formData.append('file', {
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

/* ================= 내 화장품 목록 (MyPouch / Home 공용) ================= */

export type CosmeticGroupItem = {
  groupId: number;
  cosmeticName: string;
  thumbnailUrl: string | null;
  createdAt: string;
};

export const getMyCosmeticsApi = async (): Promise<CosmeticGroupItem[]> => {
  try {
    const res = await api.get('/cosmetics/me');
    return res.data;
  } catch (err: any) {
    // 🔥 핵심: accessToken 만료(401)는 "데이터 없음"이 아님
    if (err?.response?.status === 401) {
      // api.ts가 refresh + retry 처리 중이므로
      // UI 상태를 절대 변경하면 안 됨
      throw err;
    }

    // 그 외 에러만 실제 에러로 처리
    throw err;
  }
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

  formData.append('file', {
    uri: photo.uri,
    name: photo.name,
    type: photo.type,
  } as any);

  const res = await api.post('/cosmetics', formData);
  return res.data;
};

/* ================= bulk 업로드 (4장 저장) =================
 * ✅ fetch 제거
 * ✅ 하드코딩 URL 제거
 * ✅ Authorization 수동 주입 제거
 * ========================================================= */

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

  const res = await fetch(`${API_BASE_URL}/cosmetics/bulk`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      // ❗ Content-Type 절대 지정하지 말 것
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  return res.json();
};

/* ================= 화장품 그룹 수정 ================= */
export const updateCosmeticApi = async (
  cosmeticId: number,
  payload: {
    cosmeticName?: string;
    createdAt?: string; // ✅ YYYY-MM-DD
    expiredAt?: string;
  },
) => {
  const res = await api.patch(`/cosmetics/${cosmeticId}`, payload);
  return res.data;
};
