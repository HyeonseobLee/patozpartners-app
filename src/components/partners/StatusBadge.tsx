import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RepairStatus } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

const getTone = (status: RepairStatus) => {
  if (status === '수리 완료') {
    return { bg: '#ECFDF5', text: colors.success };
  }
  if (status === '수령 완료') {
    return { bg: '#F3F4F6', text: colors.muted };
  }
  return { bg: colors.brandSoft, text: colors.brand };
};

export const StatusBadge = ({ status }: { status: RepairStatus }) => {
  const tone = getTone(status);
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 1.5,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
