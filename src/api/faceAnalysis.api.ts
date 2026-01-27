import { api } from './api';

export type FaceResultPayload = {
  analyzedAt: string;
  results: {
    label: string;
    percent: number;
  }[];
};

export const saveFaceAnalysisResultApi = async (
  payload: FaceResultPayload
) => {
  const res = await api.post('/face-analysis', payload);
  return res.data;
};
