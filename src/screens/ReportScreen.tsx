import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

const stats = [
  { label: '일간 처리 건수', value: '18건' },
  { label: '주간 처리 건수', value: '96건' },
  { label: '월간 처리 건수', value: '412건' },
];

const ReportScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>수리 통계 리포트</Text>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <Text style={styles.label}>{stat.label}</Text>
          <Text style={styles.value}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    color: colors.royalBlue,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.royalBlueSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
});

export default ReportScreen;
