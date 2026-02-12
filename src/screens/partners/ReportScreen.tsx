import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

type RangeType = '일' | '주' | '월';
const RANGE_OPTIONS: RangeType[] = ['일', '주', '월'];

export const ReportScreen = () => {
  const { cases } = useRepairCases();
  const [range, setRange] = useState<RangeType>('일');

  const metrics = useMemo(() => {
    const completed = cases.filter((item) => item.repairCompletedAt);
    const avgHours = completed.length
      ? (
          completed.reduce((sum, item) => {
            const start = +new Date(item.intakeAt);
            const end = +new Date(item.repairCompletedAt || item.intakeAt);
            return sum + (end - start) / (1000 * 60 * 60);
          }, 0) / completed.length
        ).toFixed(1)
      : '0';

    return {
      total: cases.length,
      completed: completed.length,
      avgHours,
    };
  }, [cases, range]);

  const issueBars = [
    { label: '브레이크 소음', count: 18 },
    { label: '배터리 성능 저하', count: 13 },
    { label: '타이어 마모', count: 10 },
    { label: '구동계 유격', count: 7 },
  ];
  const max = Math.max(...issueBars.map((item) => item.count));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>수리 리포트</Text>

      <View style={styles.segmentWrap}>
        {RANGE_OPTIONS.map((option) => {
          const selected = range === option;
          return (
            <Pressable key={option} onPress={() => setRange(option)} style={[styles.segmentBtn, selected && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>이번 기간 접수</Text>
          <Text style={styles.metricValue}>{metrics.total}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>완료 수리</Text>
          <Text style={styles.metricValue}>{metrics.completed}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>평균 처리 시간</Text>
          <Text style={styles.metricValue}>{metrics.avgHours}h</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>상위 고객 증상</Text>
        {issueBars.map((issue) => (
          <View key={issue.label} style={styles.barRow}>
            <Text style={styles.barLabel}>{issue.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(issue.count / max) * 100}%` }]} />
            </View>
            <Text style={styles.barCount}>{issue.count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>최근 이슈</Text>
        {cases.slice(0, 4).map((item) => (
          <View style={styles.issueCard} key={item.id}>
            <Text style={styles.issueTitle}>{item.deviceModel}</Text>
            <Text style={styles.issueMeta}>{item.customerName ?? '고객 미입력'} · {item.status}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.xs / 2,
  },
  segmentBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.full, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.brand },
  segmentText: { color: colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: colors.white },
  metricsRow: { flexDirection: 'row', gap: spacing.xs },
  metricCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  metricLabel: { color: colors.textSecondary, fontSize: 12 },
  metricValue: { color: colors.textPrimary, fontWeight: '800', fontSize: 18, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  barRow: { gap: spacing.xs },
  barLabel: { color: colors.textSecondary, fontSize: 12 },
  barTrack: { height: 10, borderRadius: radius.full, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.brand },
  barCount: { alignSelf: 'flex-end', color: colors.textSecondary, fontSize: 12 },
  issueCard: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: '#FBFDFF',
  },
  issueTitle: { color: colors.textPrimary, fontWeight: '700' },
  issueMeta: { color: colors.textSecondary, fontSize: 12 },
});
