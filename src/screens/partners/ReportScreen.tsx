import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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

const colorPalette = ['#2563EB', '#F97316', '#10B981', '#7C3AED', '#EF4444', '#06B6D4'];

const PART_CATEGORIES = [
  { label: '타이어', keywords: ['타이어', 'tire'], color: '#2563EB' },
  { label: '브레이크', keywords: ['브레이크', '제동', 'brake'], color: '#F97316' },
  { label: '배터리', keywords: ['배터리', 'battery', '전장', '충전'], color: '#10B981' },
  { label: '모터', keywords: ['모터', 'motor', '구동'], color: '#7C3AED' },
];

const PieChart = ({
  data,
}: {
  data: Array<{ label: string; value: number; color: string; subtitle: string }>;
}) => {
  const radiusSize = 78;
  const strokeWidth = 42;
  const circumference = 2 * Math.PI * radiusSize;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let accumulatedRatio = 0;

  return (
    <View style={styles.pieBlock}>
      <Svg width={220} height={220}>
        <G x={110} y={110}>
          {data.map((item) => {
            const ratio = item.value / total;
            const dash = circumference * ratio;
            const gap = circumference - dash;
            const offset = -circumference * accumulatedRatio;
            accumulatedRatio += ratio;

            return (
              <Circle
                key={item.label}
                cx={0}
                cy={0}
                r={radiusSize}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                fill="transparent"
                rotation={-90}
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.percentOverlay} pointerEvents="none">
        {data.map((item, idx) => {
          const ratio = item.value / total;
          const percent = Math.max(1, Math.round(ratio * 100));
          return (
            <Text key={`${item.label}-${idx}`} style={[styles.percentText, { color: item.color }]}>
              {item.label} {percent}%
            </Text>
          );
        })}
      </View>

      <View style={styles.legendWrap}>
        {data.map((item) => (
          <View key={item.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.metricLine}>
              {item.label}: {item.subtitle}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

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

    const partStats = PART_CATEGORIES.map((part) => ({ ...part, count: 0, revenue: 0 }));
    finished.forEach((repairCase) => {
      const selectedEstimate = repairCase.estimates.find((estimate) => estimate.id === repairCase.selectedEstimateId) ?? repairCase.estimates[0];
      const amount = selectedEstimate?.amount ?? 0;
      const matchedCategories = new Set<number>();

      repairCase.repairItems.forEach((repairItem) => {
        if (!repairItem.done) return;
        const lowered = repairItem.title.toLowerCase();
        const categoryIndex = PART_CATEGORIES.findIndex((part) => part.keywords.some((keyword) => lowered.includes(keyword.toLowerCase())));
        if (categoryIndex >= 0) {
          matchedCategories.add(categoryIndex);
          partStats[categoryIndex].count += 1;
        }
      });

      const distributionTargets = matchedCategories.size > 0 ? [...matchedCategories] : [0, 1, 2, 3];
      const splitAmount = amount / distributionTargets.length;
      distributionTargets.forEach((index) => {
        partStats[index].revenue += splitAmount;
      });
    });

    const totalPartRepairs = partStats.reduce((sum, item) => sum + item.count, 0);
    const normalizedPartStats = partStats.map((item) => ({ ...item, count: totalPartRepairs === 0 ? 1 : item.count || 1 }));

    const productCounter = new Map<string, number>();
    rangeCases.forEach((repairCase) => {
      productCounter.set(repairCase.deviceModel, (productCounter.get(repairCase.deviceModel) ?? 0) + 1);
    });
    const productStats = [...productCounter.entries()]
      .map(([label, count], idx) => ({ label, count, color: colorPalette[idx % colorPalette.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const totalProducts = productStats.reduce((sum, item) => sum + item.count, 0) || 1;

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
      partStats: normalizedPartStats,
      productStats,
      totalProducts,
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
        <Text style={styles.sectionTitle}>항목별 수리 비중</Text>
        <PieChart
          data={metrics.partStats.map((item) => ({
            label: item.label,
            value: item.count,
            color: item.color,
            subtitle: `₩${Math.round(item.revenue).toLocaleString()}`,
          }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>제품별 비중</Text>
        <PieChart
          data={metrics.productStats.map((item) => ({
            label: item.label,
            value: item.count,
            color: item.color,
            subtitle: `${Math.round((item.count / metrics.totalProducts) * 100)}%`,
          }))}
        />
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
  pieBlock: { alignItems: 'center', gap: spacing.sm },
  percentOverlay: { position: 'absolute', top: 58, alignItems: 'center', gap: 2 },
  percentText: { fontSize: 12, fontWeight: '800', textShadowColor: '#FFFFFF', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  legendWrap: { width: '100%', gap: spacing.xxs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
  durationRow: { gap: spacing.xs },
  durationHead: { flexDirection: 'row', justifyContent: 'space-between' },
  durationLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  durationHour: { color: colors.royalBlueDark, fontWeight: '700', fontSize: 13 },
  durationTrack: { height: 10, borderRadius: radius.full, backgroundColor: '#E3E9FA', overflow: 'hidden' },
  durationFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.royalBlue },
});
