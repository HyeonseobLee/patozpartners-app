import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RepairStatus, STATUS_FLOW, STATUS_LABEL } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

export const StatusStepBar = ({ status }: { status: RepairStatus }) => {
  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <View style={styles.wrap}>
      <View style={styles.progressTrack}>
        {STATUS_FLOW.map((step, idx) => {
          const active = idx <= currentIdx;
          return (
            <View key={step} style={styles.stepWrap}>
              <View style={[styles.stepDot, active ? styles.stepDotActive : styles.stepDotInactive]} />
              {idx < STATUS_FLOW.length - 1 && <View style={[styles.connector, active ? styles.connectorActive : styles.connectorInactive]} />}
            </View>
          );
        })}
      </View>

      <Text style={styles.focusLabel}>진행 상태</Text>
      <Text style={styles.focusStatus}>{STATUS_LABEL[status]}</Text>
      <Text style={styles.progressMeta}>
        {currentIdx + 1}/{STATUS_FLOW.length} 단계 완료
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    backgroundColor: '#F5F8FF',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#CFDAFF',
    gap: spacing.xs,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stepWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
  },
  stepDotActive: {
    backgroundColor: colors.royalBlue,
    borderWidth: 2,
    borderColor: '#9BB3FF',
  },
  stepDotInactive: {
    backgroundColor: '#DFE5F5',
    borderWidth: 1,
    borderColor: '#CAD3EA',
  },
  connector: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    marginHorizontal: spacing.xxs,
  },
  connectorActive: {
    backgroundColor: '#5C7EF0',
  },
  connectorInactive: {
    backgroundColor: '#E4E8F3',
  },
  focusLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  focusStatus: {
    color: colors.royalBlueDark,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  progressMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
