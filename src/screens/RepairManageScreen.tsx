import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

const steps = ['접수 완료', '진단 중', '부품 수급', '수리 진행', '출고 준비'];

const RepairManageScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>기기별 수리 진행 상황</Text>
      <View style={styles.card}>
        <Text style={styles.device}>MacBook Pro 14"</Text>
        <View style={styles.stepContainer}>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepCircle, index <= 2 && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, index <= 2 && styles.stepNumberActive]}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, index <= 2 && styles.stepLabelActive]}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    color: colors.royalBlue,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.royalBlueSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  device: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  stepContainer: {
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: colors.royalBlue,
    backgroundColor: colors.royalBlue,
  },
  stepNumber: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});

export default RepairManageScreen;
