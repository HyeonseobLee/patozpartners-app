import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RepairStatus, STATUS_LABEL } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

const getTone = (status: RepairStatus) => {
  if (status === 'NEW_REQUEST') {
    return { bg: '#FFFBEB', text: '#B45309' };
  }
  if (status === 'ESTIMATE_ACCEPTED') {
    return { bg: '#DBEAFE', text: '#1D4ED8' };
  }
  if (status === 'SHIPMENT_COMPLETED') {
    return { bg: '#ECFDF5', text: colors.success };
  }
  return { bg: colors.brandSoft, text: colors.brand };
};

export const StatusBadge = ({ status }: { status: RepairStatus }) => {
  const tone = getTone(status);
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.text }]}>{STATUS_LABEL[status]}</Text>
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
