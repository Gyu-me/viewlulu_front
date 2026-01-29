/**
 * FaceResultScreen (🔥 UI 유지 + 기능 통합 FINAL)
 * --------------------------------------------------
 * - UI / 버튼 / 배치 / 접근성: 기존 유지
 * - 기능: TFLite 결과 Top2 + 독립 퍼센트(0~100) 방식
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
import {
  useNavigation,
  useRoute,
  CommonActions,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveFaceAnalysisResultApi } from '../api/faceAnalysis.api';

type Nav = NativeStackNavigationProp<any>;
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

  /** mode */
  const mode = route.params?.mode ?? 'analysis';
  const isReadOnly = mode === 'history';

  /** photo */
  const photoPath: string | undefined = route.params?.photoPath;

  /** 얼굴형 메타 */
  const FACE_META = useMemo(
    () => ({
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
    }),
    [],
  );

  /** 모델 클래스 순서 */
  const CLASS_ORDER = useMemo(
    () => ['Heart', 'Oblong', 'Oval', 'Round', 'Square'] as const,
    [],
  );

  /** 결과 state (Top2) */
  const [results, setResults] = useState<ResultItem[]>([
    { label: '분석 중...', percent: 0, desc: '얼굴형을 분석하고 있어요.' },
    { label: '분석 중...', percent: 0, desc: '잠시만 기다려주세요.' },
  ]);

  /** 추론 */
  useEffect(() => {
    if (!photoPath || isReadOnly) return;

    const run = async () => {
      try {
        const uri = photoPath.startsWith('file://')
          ? photoPath
          : `file://${photoPath}`;

        const probs: number[] = await FaceShapeTflite.predict(uri);

        if (!Array.isArray(probs) || probs.length < 5) {
          throw new Error('Invalid probs');
        }

        const ranked = CLASS_ORDER.map((cls, i) => ({
          cls,
          prob: probs[i] ?? 0,
        })).sort((a, b) => b.prob - a.prob);

        const top2 = ranked.slice(0, 2);

        const next: ResultItem[] = top2.map(({ cls, prob }) => {
          const meta = (FACE_META as any)[cls];
          return {
            label: meta?.label ?? String(cls),
            percent: Math.round(prob * 100), // ✅ 독립 0~100%
            desc: meta?.desc ?? '얼굴형 특징 설명을 준비 중입니다.',
          };
        });

        setResults(next);
      } catch (e) {
        console.log('[FaceShape] inference error:', e);
      }
    };

    run();
  }, [photoPath, isReadOnly, CLASS_ORDER, FACE_META]);

  /** 홈 이동 (Root 구조 유지) */
  const goHome = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: { screen: 'HomeTab' },
      }),
    );
  };

  /** 저장 */
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
      goHome();
    } catch (e) {
      console.log('[FaceResult] save error', e);
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

      {photoPath && (
        <View style={styles.photoWrap}>
          <Image
            source={{
              uri: photoPath.startsWith('file://')
                ? photoPath
                : `file://${photoPath}`,
            }}
            style={styles.photo}
          />
        </View>
      )}

      {results.map((r, i) => (
        <ResultCard key={i} {...r} />
      ))}

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

/* ================= ResultCard ================= */

function ResultCard({ label, percent, desc }: ResultItem) {
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

/* ================= Styles (UI 유지) ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: {
    color: '#FFD400',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 14,
  },

  photoWrap: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: { width: '100%', height: 260 },

  card: {
    borderWidth: 2,
    borderColor: '#FFD400',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTitle: { color: '#FFD400', fontSize: 18, fontWeight: '700' },
  cardPercent: { color: '#FFD400', fontSize: 16, fontWeight: '700' },

  barBackground: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 10,
  },
  barFill: { height: '100%', backgroundColor: '#FFD400' },

  cardDesc: { color: '#FFF', fontSize: 14, lineHeight: 20 },

  buttonArea: { marginTop: 12, gap: 14 },
  primaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryText: { color: '#000', fontSize: 18, fontWeight: '800' },

  secondaryButton: {
    backgroundColor: '#FFD400',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryText: { color: '#000', fontSize: 18, fontWeight: '800' },
});
