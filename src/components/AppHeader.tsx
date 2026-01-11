/**
 * AppHeader
 * ----------------------------
 * 모든 메인 탭에서 공통으로 사용하는 상단 헤더
 *
 * 역할
 * - 현재 페이지 기능 제목 표시
 * - 상태바/노치 대응
 * - 시작 위치 통일
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
};

export default function AppHeader({ title }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
});
