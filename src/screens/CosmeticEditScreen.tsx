/**
 * CosmeticEditScreen (ACCESSIBLE FINAL)
 * --------------------------------------------------
 * - 화장품 이름 / 구매 날짜 수정 전용 화면
 * - 상단/하단 툴바 없음
 * - 스크린리더 친화 UX
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { colors } from '../theme/colors';
import { api } from '../api/api';

/* ================= Types ================= */

type RouteParams = {
  CosmeticEdit: {
    cosmeticId: string;
  };
};

type CosmeticDetail = {
  cosmeticId: number;
  cosmeticName: string;
  createdAt: string;
  purchaseDate?: string;
};

/* ================= Component ================= */

export default function CosmeticEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'CosmeticEdit'>>();
  const { cosmeticId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');

  /* ================= Fetch ================= */

  useEffect(() => {
    let alive = true;

    const fetchDetail = async () => {
      try {
        const res = await api.get(`/cosmetics/${cosmeticId}`);
        if (!alive) return;

        const data: CosmeticDetail = res.data;

        setName(data.cosmeticName);
        setPurchaseDate(
          data.purchaseDate ?? data.createdAt.slice(0, 10), // YYYY-MM-DD
        );

        AccessibilityInfo.announceForAccessibility(
          '화장품 정보 수정 화면입니다. 이름과 구매 날짜를 수정할 수 있습니다.',
        );
      } catch {
        Alert.alert('오류', '화장품 정보를 불러올 수 없습니다.');
        navigation.goBack();
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      alive = false;
    };
  }, [cosmeticId, navigation]);

  /* ================= Save ================= */

  const handleSave = async () => {
    if (!name.trim()) {
      AccessibilityInfo.announceForAccessibility('화장품 이름을 입력해주세요.');
      Alert.alert('입력 오류', '화장품 이름을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/cosmetics/${cosmeticId}`, {
        cosmeticName: name.trim(),
        purchaseDate,
      });

      AccessibilityInfo.announceForAccessibility(
        '화장품 정보가 저장되었습니다.',
      );

      navigation.goBack();
    } catch {
      Alert.alert('저장 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  /* ================= Cancel ================= */

  const handleCancel = () => {
    AccessibilityInfo.announceForAccessibility(
      '수정을 취소하고 이전 화면으로 돌아갑니다.',
    );
    navigation.goBack();
  };

  /* ================= Render ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* ===== 제목 ===== */}
        <Text style={styles.title} accessibilityRole="header">
          화장품 정보 수정
        </Text>

        {/* ===== 이름 ===== */}
        <Text style={styles.label}>화장품 이름</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          accessibilityLabel="화장품 이름 입력"
          accessibilityHint="화장품의 이름을 수정할 수 있습니다"
          returnKeyType="done"
        />

        {/* ===== 구매 날짜 ===== */}
        <Text style={styles.label}>구매 날짜</Text>
        <TextInput
          style={styles.input}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          accessibilityLabel="구매 날짜 입력"
          accessibilityHint="연도-월-일 형식으로 입력해주세요"
        />
        <Text style={styles.helper}>예시: 2024-03-15</Text>

        {/* ===== 버튼 ===== */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            accessibilityRole="button"
            accessibilityLabel="수정 취소"
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="수정 내용 저장"
            accessibilityHint="수정한 화장품 정보를 저장합니다"
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? '저장 중' : '저장'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ================= Styles ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 32,
  },

  label: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
  },

  input: {
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    color: '#FFF',
    borderWidth: 2,
    borderColor: colors.primary,
  },

  helper: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 6,
  },

  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 40,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelText: { color: '#FFF', fontSize: 18 },

  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});
