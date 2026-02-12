import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RepairStatus, STATUS_FLOW } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

export const StatusStepBar = ({ status }: { status: RepairStatus }) => {
  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <View>
      <View style={styles.barRow}>
        {STATUS_FLOW.map((step, idx) => {
          const active = idx <= currentIdx;
          return <View key={step} style={[styles.barItem, active && styles.barItemActive]} />;
        })}
      </View>
      <Text style={styles.label}>현재 단계: {status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  barRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  barItem: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: '#E5E7EB',
  },
  barItemActive: {
    backgroundColor: colors.brand,
  },
  label: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
