/**
 * FaceResultScreen
 * --------------------------------------------------
 * 얼굴형 분석 결과 화면
 *
 * 기능 설명:
 * - 얼굴형 분석 결과 시각화
 * - 분석 직후 결과 저장 가능
 * - 최근 분석 결과 진입 시 읽기 전용
 *
 * UX 설계:
 * - FeatureStack 내부
 * - 하단 탭 없음
 * - 홈으로 돌아가기 버튼 제공
 *
 * 동작 분기:
 * - route.params.mode === 'history' → 저장 버튼 숨김
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeModules,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveFaceAnalysisResultApi } from '../api/faceAnalysis.api';
import { CommonActions } from '@react-navigation/native';

type Nav = NativeStackNavigationProp<any>;

/* =========================================================
 * ✅ [추가] 네이티브(TFLite) 모듈 연결
 * ========================================================= */
const { FaceShapeTflite } = NativeModules as any;

type ResultItem = {
  label: string;
  percent: number;
  desc: string;
};

export default function FaceResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  /** 진입 모드 */
  const mode = route.params?.mode ?? 'analysis';
  const isReadOnly = mode === 'history';

  /* =========================================================
   * ✅ [추가] FaceAnalysisScreen에서 전달받은 촬영 사진 경로
   * ========================================================= */
  const photoPath: string | undefined = route.params?.photoPath;

  /* =========================================================
   * ✅ [추가] 얼굴형 라벨/설명 매핑 (Top2 카드에 사용)
   * - 모델 클래스(영문) → 화면 표시(한글) + 1줄 설명
   * - 필요하면 문구만 너 스타일로 바꿔도 됨
   * ========================================================= */
  const FACE_META = useMemo(() => {
    return {
      Heart: {
        label: '하트형',
        desc: '이마가 넓고 턱이 갸름해 또렷한 인상을 줍니다.',
      },
      Oblong: {
        label: '긴형',
        desc: '얼굴 길이가 비교적 길고 세로 비율이 강조됩니다.',
      },
      Oval: {
        label: '계란형',
        desc: '이마와 턱의 균형이 좋아 가장 이상적인 얼굴형입니다.',
      },
      Round: {
        label: '둥근형',
        desc: '부드러운 인상이며 볼 라인이 둥글게 도드라집니다.',
      },
      Square: {
        label: '각진형',
        desc: '턱선이 뚜렷하고 선이 각져 강한 이미지가 납니다.',
      },
    } as const;
  }, []);

  /* =========================================================
   * ✅ [추가] 모델 class_indices 순서에 맞춘 클래스 배열
   * - facetype_converted.py에서 flow_from_directory 기준으로 보통 알파벳순:
   *   Heart, Oblong, Oval, Round, Square
   * - 만약 네 학습 로그 class_indices가 다르면, 여기 순서만 바꾸면 끝
   * ========================================================= */
  const CLASS_ORDER = useMemo(() => {
    return ['Heart', 'Oblong', 'Oval', 'Round', 'Square'] as const;
  }, []);

  /* =========================================================
   * ✅ [추가] 결과 state: 초기에는 빈 값(0%)으로 2개 카드만 준비
   * - “임의 결과 3개” 대신 Top2만 표시하도록 변경
   * ========================================================= */
  const [results, setResults] = useState<ResultItem[]>([
    { label: '분석 중...', percent: 0, desc: '얼굴형을 분석하고 있어요.' },
    { label: '분석 중...', percent: 0, desc: '잠시만 기다려주세요.' },
  ]);

  /* =========================================================
   * ✅ [추가] analysis 모드에서만: photoPath로 추론 1회 수행 → Top2 반영
   * - 원본 버튼/네비/화면 구조는 그대로
   * ========================================================= */
useEffect(() => {
  if (!photoPath) return;
  if (isReadOnly) return;

  const run = async () => {
    try {
      // ✅ [추가] 호출 여부/값 확인용 로그 (기능 영향 없음)
      console.log('[FaceShape] photoPath(raw)=', photoPath);
      console.log('[FaceShape] module exists=', !!FaceShapeTflite);
      console.log('[FaceShape] predict typeof=', typeof FaceShapeTflite?.predict);

      // ✅ [추가] 네이티브로 넘길 경로를 file:// 로 통일 (안전)
      const uri =
        photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;
      console.log('[FaceShape] photoPath(uri)=', uri);
      console.log('[FaceShape] calling native predict...');

      // ✅ 네이티브 모듈로부터 5개 확률 받기 (softmax)
      const probs: number[] = await FaceShapeTflite.predict(uri);
      console.log('[FaceShape] probs=', probs);

      // ✅ (안전) 길이 부족/오류 대비
      if (!Array.isArray(probs) || probs.length < 5) {
        throw new Error('Invalid probs from native module');
      }

      // ✅ 클래스별 확률 묶기
      const items = CLASS_ORDER.map((cls, idx) => ({
        cls,
        prob: probs[idx] ?? 0,
      }));

      // ✅ Top-2 정렬
      items.sort((a, b) => b.prob - a.prob);
      const top2 = items.slice(0, 2);

      // ✅ 화면에 표시할 형태로 변환
      const next: ResultItem[] = top2.map(({ cls, prob }) => {
        const meta = (FACE_META as any)[cls];
        return {
          label: meta?.label ?? String(cls),
          percent: Math.round(prob * 100),
          desc: meta?.desc ?? '얼굴형 특징 설명을 준비 중입니다.',
        };
      });

      setResults(next);
    } catch (e) {
      // ✅ [추가] 에러를 문자열로도 찍어보기 (네이티브 reject 내용 확인)
      console.log('[FaceShape] inference error=', String(e));
      console.log('FaceShape inference error:', e);
      // 실패 시에도 화면이 깨지지 않도록 기존 “분석 중” 상태 유지
    }
  };

  run();
}, [photoPath, isReadOnly, CLASS_ORDER, FACE_META]);


  /** 홈으로 돌아가기 (원본 유지) */
  const goHome = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'HomeTab',
        },
      })
    );
  };



  const handleSave = async () => {
    try {
      const payload = {
        analyzedAt: new Date().toISOString(),
        results: results.map(r => ({
          label: r.label,
          percent: r.percent,
        })),
      };

      await saveFaceAnalysisResultApi(payload);

      // ✅ 저장 성공 후 홈으로
      goHome();
    } catch (e) {
      console.log('[FaceResult] save error', e);
      Alert.alert(
        '저장 실패',
        '결과 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
      );
    }
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 40 + insets.bottom,
      }}
    >
      <Text style={styles.title}>얼굴형 분석 결과</Text>

      {/* =========================================================
       * ✅ [추가] 상단에 촬영된 얼굴 사진 표시
       * - photoPath는 기기 로컬 경로라서 uri에 file:// 붙여 표시
       * ========================================================= */}
      {photoPath ? (
        <View style={styles.photoWrap}>
          <Image
            source={{
              uri: photoPath.startsWith('file://')
                ? photoPath
                : `file://${photoPath}`,
            }}
            style={styles.photo}
            resizeMode="cover"
          />
        </View>
      ) : null}

      {/* ✅ Top-2 결과 카드 표시 (원본 ResultCard 컴포넌트 그대로 활용) */}
      {results.map((r, idx) => (
        <ResultCard key={idx} label={r.label} percent={r.percent} desc={r.desc} />
      ))}

      {/* 액션 버튼 (원본 유지) */}
      <View style={styles.buttonArea}>
        {!isReadOnly && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryText}>결과 저장하기</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={goHome}>
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

/* ================= 서브 컴포넌트 (원본 유지) ================= */

function ResultCard({
  label,
  percent,
  desc,
}: {
  label: string;
  percent: number;
  desc: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.cardPercent}>{percent}%</Text>
      </View>

      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>

      <Text style={styles.cardDesc}>{desc}</Text>
    </View>
  );
}

/* ================= 스타일 (원본 + 최소 추가) ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },

  title: {
    color: '#FFD400',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 14,
  },

  /* ✅ [추가] 촬영 사진 영역 스타일 */
  photoWrap: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 260,
  },

  card: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  cardTitle: {
    color: '#FFD400',
    fontSize: 18,
    fontWeight: '700',
  },

  cardPercent: {
    color: '#FFD400',
    fontSize: 16,
    fontWeight: '700',
  },

  barBackground: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },

  barFill: {
    height: '100%',
    backgroundColor: '#FFD400',
  },

  cardDesc: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },

  buttonArea: {
    marginTop: 12,
    marginBottom: 20,
    gap: 14,
  },


  primaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },

  primaryText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },

  secondaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },

  secondaryText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});
