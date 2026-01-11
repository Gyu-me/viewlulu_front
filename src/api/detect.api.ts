/**
 * 화장품 인식 API (최종본)
 * - 사진 업로드 후 서버에서 인식 결과 반환
 * - detectedId 기반 결과 처리
 *
 * ⚠️ 현재 백엔드에는 "인식 API"가 없으므로
 *     임시로 /photos 업로드 후
 *     detectedId를 서버 응답 기준으로 결정하는 구조
 *     (추후 Python 서버 연동 시 이 파일만 교체)
 */

import { api } from './client';

export type DetectResponse = {
  detectedId: string | null;
};

export const detectCosmeticApi = async (
  photoUri: string,
): Promise<DetectResponse> => {
  const formData = new FormData();

  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'detect.jpg',
  } as any);

  // ⚠️ 현재는 photos 업로드로 대체
  await api.post('/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // ✅ 임시 정책:
  // 업로드 성공 = 인식 성공 (추후 서버 판단으로 교체)
  return { detectedId: '1' };
};
