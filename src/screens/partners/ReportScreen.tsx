import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

type RangeType = '일간' | '주간' | '월간';
const RANGE_OPTIONS: RangeType[] = ['일간', '주간', '월간'];

export const ReportScreen = () => {
  const { cases } = useRepairCases();
  const [range, setRange] = useState<RangeType>('일간');

  const metrics = useMemo(() => {
    const finished = cases.filter((item) => item.status === 'FINISHED');
    const revenue = finished.reduce((sum, item) => sum + (item.estimate?.amount ?? 0), 0);

    const itemCounter = new Map<string, number>();
    cases.forEach((repairCase) => {
      repairCase.repairItems.forEach((repairItem) => {
        itemCounter.set(repairItem.title, (itemCounter.get(repairItem.title) ?? 0) + 1);
      });
    });

    const topItem = [...itemCounter.entries()].sort((a, b) => b[1] - a[1])[0];
    const ratedCases = cases.filter((item) => item.rating);
    const avgRating = ratedCases.length
      ? (ratedCases.reduce((sum, item) => sum + (item.rating ?? 0), 0) / ratedCases.length).toFixed(1)
      : '0.0';

    return {
      totalFinished: finished.length,
      revenue,
      topItem: topItem ? `${topItem[0]} (${topItem[1]}건)` : '데이터 없음',
      avgRating,
    };
  }, [cases, range]);

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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>핵심 지표 ({range})</Text>
        <Text style={styles.metricLine}>총 수리 완료 건수: {metrics.totalFinished}건</Text>
        <Text style={styles.metricLine}>누적 매출액: {metrics.revenue.toLocaleString()}원</Text>
        <Text style={styles.metricLine}>가장 많이 수리된 항목: {metrics.topItem}</Text>
        <Text style={styles.metricLine}>고객 만족도(별점): {metrics.avgRating} / 5.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>최근 완료 건</Text>
        {cases
          .filter((item) => item.status === 'FINISHED')
          .slice(0, 4)
          .map((item) => (
            <View key={item.id} style={styles.issueCard}>
              <Text style={styles.issueTitle}>{item.deviceModel}</Text>
              <Text style={styles.issueMeta}>{item.customerName ?? '고객 미입력'} · {item.estimate?.amount?.toLocaleString() ?? 0}원</Text>
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
  card: {
    backgroundColor: colors.white,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  metricLine: { color: colors.textSecondary, fontSize: 14 },
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
