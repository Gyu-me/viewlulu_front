/**
 * (앱) cosmeticDetect.api.ts
 * --------------------------------------------------
 * 🔥 REAL FINAL – INTERCEPTOR BYPASS
 *
 * [설계 의도]
 * - detect API는 multipart + Android + nginx 조합에서
 *   axios interceptor 충돌이 잦아 fetch를 사용
 *
 * [보장 사항]
 * ✅ multipart/form-data 완전 보장
 * ✅ Android RN fetch 안정성 확보
 * ✅ Authorization 직접 주입
 * ✅ nginx /api proxy 정상 통과
 * ✅ multer.single('file') 정확히 대응
 *
 * [금지 사항]
 * ❌ api.ts axios 인스턴스 사용 금지
 * ❌ Content-Type 수동 지정 절대 금지
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

/* =========================
 * Response Type
 * ========================= */

export type DetectCosmeticResponse = {
  detectedId: string;
  bestDistance?: number;
};

/* =========================
 * Detect API
 * ========================= */

export const detectCosmeticApi = async (photo: {
  uri: string;
  name: string;
  type: string;
}): Promise<DetectCosmeticResponse> => {
  console.log('[detectCosmeticApi] called', photo);

  /* --------------------------------------------------
   * 1️⃣ Access Token 직접 조회
   * -------------------------------------------------- */
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    throw new Error('NO_TOKEN');
  }

  /* --------------------------------------------------
   * 2️⃣ FormData 구성
   * - 서버: multer.single('file')
   * - key 이름: 반드시 'file'
   * -------------------------------------------------- */
  const formData = new FormData();

  formData.append('file', {
    uri: photo.uri,     // ⚠️ 반드시 file:// 포함된 uri
    name: photo.name,   // 예: capture.jpg
    type: photo.type,   // image/jpeg
  } as any);

  /* --------------------------------------------------
   * 3️⃣ fetch 호출
   * - Content-Type ❌ (RN이 boundary 자동 설정)
   * - Authorization만 명시
   * -------------------------------------------------- */
  const res = await fetch(
    `${API_BASE_URL}/cosmetics/detect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // ❗ Content-Type 절대 지정 금지
      },
      body: formData,
    }
  );

  /* --------------------------------------------------
   * 4️⃣ HTTP 레벨 오류 처리
   * - 404: 인식 실패 (정상 케이스)
   * - 500: 서버 오류
   * -------------------------------------------------- */
  if (!res.ok) {
    const text = await res.text();
    console.error('[detectCosmeticApi][HTTP ERROR]', text);

    // ❗ 서버에서 message 내려주는 구조 유지
    throw new Error('DETECT_FAILED');
  }

  /* --------------------------------------------------
   * 5️⃣ 정상 응답 파싱
   * -------------------------------------------------- */
  const data = await res.json();
  return data as DetectCosmeticResponse;
};
