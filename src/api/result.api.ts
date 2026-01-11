/**
 * 분석 결과 API (최종본)
 * --------------------------------------------------
 * - 얼굴 / 피부 분석 결과 저장
 * - 최근 분석 결과 목록 조회
 *
 * ⚠️ 현재 백엔드에는 실제 결과 저장 테이블이 없으므로
 *    - 저장 API: mock 성공 처리
 *    - 조회 API: 추후 백엔드 구현 시 그대로 연결
 */

import { api } from './client';

export type AnalysisType = 'face' | 'skin';

export type SaveResultPayload = {
  type: AnalysisType;
  result: Record<string, any>;
};

export type RecentResultItem = {
  id: number;
  type: AnalysisType;
  summary: string;
  created_at: string;
};

export const saveResultApi = async (payload: SaveResultPayload) => {
  // POST /analysis/results (추후 백엔드 연결)
  return payload;
};

export const getRecentResultsApi = async (): Promise<RecentResultItem[]> => {
  // GET /analysis/recent (추후 백엔드 연결)
  return [];
};
