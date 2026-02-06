/**
 * CosmeticDetectResultScreen (🔥 CaptureStack 종료 기준 최종본 + UI 확장)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
} from 'react-native';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';

import Tts from 'react-native-tts';

import { colors } from '../theme/colors';
import { getCosmeticDetailApi, CosmeticDetail } from '../api/cosmetic.api';

type Route = RouteProp<any, 'CosmeticDetectResult'>;

export default function CosmeticDetectResultScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  const cosmeticIdRaw = route.params?.cosmeticId as any;
  const cosmeticId =
    cosmeticIdRaw !== undefined && cosmeticIdRaw !== null
      ? String(cosmeticIdRaw)
      : null;

  const [loading, setLoading] = useState(true);
  const [cosmetic, setCosmetic] = useState<CosmeticDetail | null>(null);

  const hasSpokenRef = useRef(false);
  const hasErrorSpokenRef = useRef(false);

  /* ================= Back Handling ================= */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: { routes: [{ name: 'HomeTab' }] },
            },
          ],
        });
        return true;
      };

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => sub.remove();
    }, [navigation]),
  );

  /* ================= Data Fetch ================= */
  useEffect(() => {
    if (!cosmeticId) return;

    let isActive = true;

    getCosmeticDetailApi(cosmeticId)
      .then(data => {
        if (isActive) setCosmetic(data);
      })
      .catch((e: any) => {
        if (!isActive) return;

        const msg =
          e?.message === 'NO_TOKEN'
            ? '로그인이 만료되었습니다. 다시 로그인해주세요.'
            : '화장품 정보를 불러오지 못했습니다.';

        Alert.alert('조회 실패', msg);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [cosmeticId]);

  /* ================= Result TTS ================= */
  useEffect(() => {
    if (!cosmetic || hasSpokenRef.current) return;

    const name = cosmetic.cosmeticName || cosmetic.name;
    if (!name) return;

    hasSpokenRef.current = true;
    setScreenReaderEnabled(false);

    Tts.stop();
    Tts.speak(`이 화장품은 ${name} 입니다.`);
  }, [cosmetic]);

  //없어용
  useEffect(() => {
    if (loading) return;
    if (cosmetic) return;
    if (hasErrorSpokenRef.current) return;

    hasErrorSpokenRef.current = true;

    setScreenReaderEnabled(false);
    Tts.stop();
    Tts.speak(
      '화장품 정보를 불러올 수 없습니다. 홈으로 돌아가기를 눌러주세요.',
    );
  }, [loading, cosmetic]);

  useEffect(() => {
    const onFinish = () => setScreenReaderEnabled(true);
    const sub = Tts.addEventListener('tts-finish', onFinish);
    return () => sub?.remove();
  }, []);

  /* ================= Navigation ================= */

  const exitToMain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', state: { routes: [{ name: 'HomeTab' }] } }],
    });
  };

  const exitToMyPouch = () => {
    if (!cosmeticId) return;

    navigation.navigate('MainTabs', {
      screen: 'MyPouchTab',
      params: {
        screen: 'CosmeticDetail',
        params: { cosmeticId, fromDetect: true },
      },
    });
  };

  /* ================= Render ================= */

  if (!cosmeticId) {
    return (
      <View style={styles.container} importantForAccessibility="auto">
        <Text style={styles.title} accessibilityRole="header">
          인식 결과
        </Text>

        <Text style={styles.desc}>화장품 정보를 불러올 수 없습니다.</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={exitToMain}
          accessibilityRole="button"
          accessibilityLabel="홈으로 돌아가기"
        >
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.primary, marginTop: 12 }}>
          인식 결과 불러오는 중...
        </Text>
      </View>
    );
  }

  if (!cosmetic) {
    return (
      <View style={styles.container} importantForAccessibility="auto">
        <Text style={styles.title} accessibilityRole="header">
          인식 결과
        </Text>

        <Text style={styles.desc}>화장품 정보를 불러올 수 없습니다.</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={exitToMain}
          accessibilityRole="button"
          accessibilityLabel="홈으로 돌아가기"
        >
          <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = cosmetic.cosmeticName || cosmetic.name;

  return (
    <View
      style={styles.container}
      importantForAccessibility={
        screenReaderEnabled ? 'auto' : 'no-hide-descendants'
      }
    >
      <Text style={styles.title} accessibilityRole="header">
        인식 결과
      </Text>

      <View
        style={styles.imageWrap}
        accessibilityRole="image"
        accessibilityLabel={`화장품 인식 결과 이미지. 인식된 화장품은 ${displayName} 입니다.`}
      >
        <Image
          source={require('../assets/detectResult.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.desc}>
        이 화장품은{'\n'}
        <Text style={styles.name}>{displayName}</Text>
        {'\n'}입니다.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={exitToMyPouch}>
        <Text style={styles.primaryText}>화장품 정보 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={exitToMain}>
        <Text style={styles.secondaryText}>홈으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: 220,
    height: 220,
  },
  desc: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 40,
    textAlign: 'center',
  },
  name: {
    fontWeight: '800',
    fontSize: 18,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
