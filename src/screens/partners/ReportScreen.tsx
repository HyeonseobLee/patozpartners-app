import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
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
  const radiusSize = 84;
  const center = 110;
  const labelRadius = radiusSize * 0.62;
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let accumulatedAngle = -90;

  const buildArcPath = (startAngle: number, endAngle: number) => {
    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;
    const startX = center + radiusSize * Math.cos(startRad);
    const startY = center + radiusSize * Math.sin(startRad);
    const endX = center + radiusSize * Math.cos(endRad);
    const endY = center + radiusSize * Math.sin(endRad);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${center} ${center} L ${startX} ${startY} A ${radiusSize} ${radiusSize} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  return (
    <View style={styles.pieBlock}>
      <Svg width={220} height={220}>
        <G>
          {data.map((item, idx) => {
            const ratio = item.value / total;
            const sweepAngle = ratio * 360;
            const startAngle = accumulatedAngle;
            const endAngle = accumulatedAngle + sweepAngle;
            const midAngle = startAngle + sweepAngle / 2;
            const labelX = center + labelRadius * Math.cos((Math.PI / 180) * midAngle);
            const labelY = center + labelRadius * Math.sin((Math.PI / 180) * midAngle);
            accumulatedAngle = endAngle;

            if (idx === 0 && ratio >= 0.999) {
              return (
                <G key={item.label}>
                  <Circle cx={center} cy={center} r={radiusSize} fill={item.color} />
                  <SvgText x={center} y={center + 4} textAnchor="middle" style={styles.percentTextSvg}>
                    100%
                  </SvgText>
                </G>
              );
            }

            return (
              <G key={item.label}>
                <Path d={buildArcPath(startAngle, endAngle)} fill={item.color} stroke={colors.white} strokeWidth={1.5} />
                <SvgText x={labelX} y={labelY + 4} textAnchor="middle" style={styles.percentTextSvg}>
                  {Math.max(1, Math.round(ratio * 100))}%
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>

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

    const productCountMap = new Map<string, number>();
    const productFinishedCountMap = new Map<string, number>();
    const productRevenueMap = new Map<string, number>();

    rangeCases.forEach((repairCase) => {
      productCountMap.set(repairCase.deviceModel, (productCountMap.get(repairCase.deviceModel) ?? 0) + 1);
    });

    finished.forEach((repairCase) => {
      const selectedEstimate = repairCase.estimates.find((estimate) => estimate.id === repairCase.selectedEstimateId) ?? repairCase.estimates[0];
      const amount = selectedEstimate?.amount ?? 0;
      productFinishedCountMap.set(repairCase.deviceModel, (productFinishedCountMap.get(repairCase.deviceModel) ?? 0) + 1);
      productRevenueMap.set(repairCase.deviceModel, (productRevenueMap.get(repairCase.deviceModel) ?? 0) + amount);
    });

    const averageRevenuePerComplete = finished.length > 0 ? revenue / finished.length : 0;
    const productStats = [...productCountMap.entries()]
      .map(([label, count], idx) => {
        const finishedCount = productFinishedCountMap.get(label) ?? 0;
        const directRevenue = productRevenueMap.get(label) ?? 0;
        const modeledRevenue = directRevenue > 0 ? directRevenue : Math.round(count * averageRevenuePerComplete * 0.45);
        const valueScore = Math.max(1, count + finishedCount * 2);

        return {
          label,
          value: valueScore,
          revenue: modeledRevenue,
          color: colorPalette[idx % colorPalette.length],
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
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
            value: item.value,
            color: item.color,
            subtitle: `₩${Math.round(item.revenue).toLocaleString()}`,
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
  percentTextSvg: { fontSize: 12, fontWeight: '800', fill: colors.white },
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
