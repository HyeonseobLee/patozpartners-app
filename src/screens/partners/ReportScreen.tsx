import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';

type RangeType = '일간' | '주간' | '월간';
const RANGE_OPTIONS: RangeType[] = ['일간', '주간', '월간'];

const isInRange = (targetIso: string, range: RangeType) => {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const rangeMs = range === '일간' ? dayMs : range === '주간' ? dayMs * 7 : dayMs * 30;
  return now - target <= rangeMs;
};

export const ReportScreen = () => {
  const { cases } = useRepairCases();
  const [range, setRange] = useState<RangeType>('일간');

  const metrics = useMemo(() => {
    const rangeCases = cases.filter((item) => isInRange(item.intakeAt, range));
    const finished = rangeCases.filter((item) => item.status === 'RECEIVED_COMPLETED');
    const revenue = finished.reduce((sum, item) => {
      const selectedEstimate = item.estimates.find((estimate) => estimate.id === item.selectedEstimateId) ?? item.estimates[0];
      return sum + (selectedEstimate?.amount ?? 0);
    }, 0);

    const modelCounter = new Map<string, number>();
    const repairItemCounter = new Map<string, number>();

    rangeCases.forEach((repairCase) => {
      modelCounter.set(repairCase.deviceModel, (modelCounter.get(repairCase.deviceModel) ?? 0) + 1);
      repairCase.repairItems.forEach((repairItem) => {
        if (!repairItem.done) return;
        repairItemCounter.set(repairItem.title, (repairItemCounter.get(repairItem.title) ?? 0) + 1);
      });
    });

    const modelStats = [...modelCounter.entries()]
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const repairItemStats = [...repairItemCounter.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const maxModelCount = modelStats[0]?.count ?? 1;
    const maxRepairItemCount = repairItemStats[0]?.count ?? 1;

    return {
      totalFinished: finished.length,
      revenue,
      totalReceived: rangeCases.length,
      modelStats,
      maxModelCount,
      repairItemStats,
      maxRepairItemCount,
    };
  }, [cases, range]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <Text style={styles.metricLine}>수령 완료 건수: {metrics.totalFinished}건</Text>
        <Text style={styles.metricLine}>매출액: {metrics.revenue.toLocaleString()}원</Text>
        <Text style={styles.metricLine}>전체 입고 건수: {metrics.totalReceived}건</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>모델별 입고 통계</Text>
        {metrics.modelStats.length === 0 && <Text style={styles.metricLine}>선택한 기간에 데이터가 없습니다.</Text>}
        {metrics.modelStats.map((modelInfo) => (
          <View key={modelInfo.model} style={styles.modelRow}>
            <Text style={styles.modelLabel}>{modelInfo.model}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(modelInfo.count / metrics.maxModelCount) * 100}%` }]} />
            </View>
            <Text style={styles.modelCount}>{modelInfo.count}건</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>수리 항목별 통계</Text>
        {metrics.repairItemStats.length === 0 && <Text style={styles.metricLine}>완료된 수리 항목 데이터가 없습니다.</Text>}
        {metrics.repairItemStats.map((repairItemInfo) => (
          <View key={repairItemInfo.label} style={styles.modelRow}>
            <Text style={styles.modelLabel}>{repairItemInfo.label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(repairItemInfo.count / metrics.maxRepairItemCount) * 100}%` }]} />
            </View>
            <Text style={styles.modelCount}>{repairItemInfo.count}회</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
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
  modelRow: { gap: spacing.xs },
  modelLabel: { color: colors.textPrimary, fontWeight: '700' },
  barTrack: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.royalBlueSoft,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.royalBlue,
  },
  modelCount: { color: colors.textSecondary, fontSize: 12 },
});
