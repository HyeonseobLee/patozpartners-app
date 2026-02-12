import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
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

const colorPalette = ['#4169E1', '#5A7DF0', '#7F97F8', '#9BAEFF', '#BED0FF', '#3355C7'];

export const ReportScreen = () => {
  const { cases } = useRepairCases();
  const [range, setRange] = useState<RangeType>('주간');

  const metrics = useMemo(() => {
    const rangeCases = cases.filter((item) => isInRange(item.intakeAt, range));
    const finished = rangeCases.filter((item) => item.status === 'SHIPMENT_COMPLETED');

    const revenue = finished.reduce((sum, item) => {
      const selectedEstimate = item.estimates.find((estimate) => estimate.id === item.selectedEstimateId) ?? item.estimates[0];
      return sum + (selectedEstimate?.amount ?? 0);
    }, 0);

    const repairItemCounter = new Map<string, number>();
    rangeCases.forEach((repairCase) => {
      repairCase.repairItems.forEach((repairItem) => {
        if (!repairItem.done) return;
        repairItemCounter.set(repairItem.title, (repairItemCounter.get(repairItem.title) ?? 0) + 1);
      });
    });

    const repairItemStats = [...repairItemCounter.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const totalRepairs = repairItemStats.reduce((sum, item) => sum + item.count, 0) || 1;

    const trendLength = range === '월간' ? 4 : range === '주간' ? 7 : 6;
    const trendData = Array.from({ length: trendLength }, (_, idx) => {
      const bucketCases = rangeCases.filter((repairCase) => {
        const dayGap = Math.floor((Date.now() - new Date(repairCase.intakeAt).getTime()) / (24 * 60 * 60 * 1000));
        return dayGap >= idx && dayGap < idx + 1;
      });
      const completedCount = bucketCases.filter((repairCase) => repairCase.status === 'REPAIR_COMPLETED' || repairCase.status === 'SHIPMENT_COMPLETED').length;
      const expectedRevenue = bucketCases.reduce((sum, repairCase) => {
        const selectedEstimate = repairCase.estimates.find((estimate) => estimate.id === repairCase.selectedEstimateId) ?? repairCase.estimates[0];
        return sum + (selectedEstimate?.amount ?? 0);
      }, 0);
      return { label: `${trendLength - idx}`, completedCount, expectedRevenue };
    }).reverse();

    const maxCompleted = Math.max(...trendData.map((item) => item.completedCount), 1);

    const stageDurationMap = new Map<string, { totalMs: number; count: number }>();
    rangeCases.forEach((repairCase) => {
      const ordered = [...repairCase.timeline].sort((a, b) => +new Date(a.updatedAt) - +new Date(b.updatedAt));
      ordered.forEach((point, idx) => {
        const next = ordered[idx + 1];
        if (!next) return;
        const diff = Math.max(new Date(next.updatedAt).getTime() - new Date(point.updatedAt).getTime(), 0);
        const current = stageDurationMap.get(point.status) ?? { totalMs: 0, count: 0 };
        stageDurationMap.set(point.status, { totalMs: current.totalMs + diff, count: current.count + 1 });
      });
    });

    const stageDurations = STATUS_FLOW.map((status) => {
      const raw = stageDurationMap.get(status);
      const avgHour = raw ? raw.totalMs / raw.count / (1000 * 60 * 60) : 0;
      return { status, label: STATUS_LABEL[status], avgHour: Number(avgHour.toFixed(1)) };
    }).filter((item) => item.avgHour > 0);

    const maxStageHour = Math.max(...stageDurations.map((item) => item.avgHour), 1);

    return {
      totalFinished: finished.length,
      revenue,
      totalReceived: rangeCases.length,
      repairItemStats,
      totalRepairs,
      trendData,
      maxCompleted,
      stageDurations,
      maxStageHour,
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
        <Text style={styles.metricLine}>출고 완료 건수: {metrics.totalFinished}건</Text>
        <Text style={styles.metricLine}>예상 매출: {metrics.revenue.toLocaleString()}원</Text>
        <Text style={styles.metricLine}>전체 접수 건수: {metrics.totalReceived}건</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>항목별 수리 비중 (Pie Chart)</Text>
        <View style={styles.pieWrap}>
          <View style={styles.pieCircle}>
            {metrics.repairItemStats.map((item, idx) => {
              const ratio = item.count / metrics.totalRepairs;
              return (
                <View key={item.label} style={[styles.pieSlice, { width: `${Math.max(ratio * 100, 8)}%`, backgroundColor: colorPalette[idx % colorPalette.length] }]} />
              );
            })}
          </View>
        </View>
        {metrics.repairItemStats.map((item, idx) => (
          <View key={item.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colorPalette[idx % colorPalette.length] }]} />
            <Text style={styles.metricLine}>
              {item.label}: {Math.round((item.count / metrics.totalRepairs) * 100)}%
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>매출/완료 추이 (Line Chart)</Text>
        <View style={styles.lineArea}>
          {metrics.trendData.map((point, idx) => {
            const left = `${(idx / Math.max(metrics.trendData.length - 1, 1)) * 100}%`;
            const top = 100 - (point.completedCount / metrics.maxCompleted) * 100;
            return (
              <View key={point.label} style={[styles.linePointWrap, { left }]}>
                <View style={[styles.linePoint, { top: `${Math.max(top, 6)}%` }]} />
                <Text style={styles.lineLabel}>{point.label}</Text>
              </View>
            );
          })}
        </View>
        {metrics.trendData.map((point) => (
          <Text key={point.label} style={styles.metricLine}>
            구간 {point.label}: 완료 {point.completedCount}건 / 예상 수익 {point.expectedRevenue.toLocaleString()}원
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>평균 수리 소요 시간 (병목 확인)</Text>
        {metrics.stageDurations.length === 0 && <Text style={styles.metricLine}>평균 시간 계산 데이터가 없습니다.</Text>}
        {metrics.stageDurations.map((stage) => (
          <View key={stage.status} style={styles.durationRow}>
            <View style={styles.durationHead}>
              <Text style={styles.durationLabel}>{stage.label}</Text>
              <Text style={styles.durationHour}>{stage.avgHour}시간</Text>
            </View>
            <View style={styles.durationTrack}>
              <View style={[styles.durationFill, { width: `${(stage.avgHour / metrics.maxStageHour) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  segmentWrap: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderSoft, padding: spacing.xs / 2 },
  segmentBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.full, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: colors.brand },
  segmentText: { color: colors.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: colors.white },
  card: { backgroundColor: colors.white, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  metricLine: { color: colors.textSecondary, fontSize: 13 },
  pieWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  pieCircle: { width: 170, height: 170, borderRadius: radius.full, overflow: 'hidden', borderWidth: 5, borderColor: colors.royalBlueSoft, flexDirection: 'row', backgroundColor: '#E9EEFF' },
  pieSlice: { height: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  lineArea: { height: 120, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: '#F8FAFF', justifyContent: 'flex-end', paddingBottom: spacing.md, position: 'relative' },
  linePointWrap: { position: 'absolute', bottom: 0, marginLeft: -7, alignItems: 'center' },
  linePoint: { width: 12, height: 12, borderRadius: radius.full, backgroundColor: colors.royalBlue, borderWidth: 2, borderColor: '#AFC2FF', position: 'absolute' },
  lineLabel: { marginTop: 84, fontSize: 11, color: colors.textSecondary },
  durationRow: { gap: spacing.xs },
  durationHead: { flexDirection: 'row', justifyContent: 'space-between' },
  durationLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  durationHour: { color: colors.royalBlueDark, fontWeight: '700', fontSize: 13 },
  durationTrack: { height: 10, borderRadius: radius.full, backgroundColor: '#E3E9FA', overflow: 'hidden' },
  durationFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.royalBlue },
});
