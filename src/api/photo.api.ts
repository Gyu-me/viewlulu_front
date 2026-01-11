/**
 * 사진 업로드 API (최종본)
 * - 얼굴/피부/인식 공용 업로드
 * - Authorization 자동 포함 (client.ts)
 */

import { api } from './client';

export type UploadPhotoResponse = {
  message: string;
  photo: {
    id: number;
    user_id: number;
    s3_key: string;
    created_at: string;
  };
};

export const uploadPhotoApi = async (
  photoUri: string,
): Promise<UploadPhotoResponse> => {
  const formData = new FormData();

  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const res = await api.post<UploadPhotoResponse>('/photos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
};
