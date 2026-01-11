/**
 * 분석 공용 API (최종본)
 * - 얼굴/피부 분석 공용 업로드
 * - 결과 저장 API 분리 (추후 Python 서버 연동 대비)
 */

import { api } from './client';

export type AnalysisUploadResponse = {
  message: string;
  photo: {
    id: number;
    user_id: number;
    s3_key: string;
    created_at: string;
  };
};

export type SaveAnalysisResultPayload = {
  type: 'face' | 'skin';
  result: Record<string, any>;
};

export const uploadAnalysisPhotoApi = async (
  photoUri: string,
): Promise<AnalysisUploadResponse> => {
  const formData = new FormData();

  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'analysis.jpg',
  } as any);

  const res = await api.post<AnalysisUploadResponse>('/photos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};

// ⚠️ 백엔드에 아직 없음 — 구조만 확정
export const saveAnalysisResultApi = async (
  payload: SaveAnalysisResultPayload,
) => {
  // POST /analysis/results (추후 구현)
  return payload;
};
