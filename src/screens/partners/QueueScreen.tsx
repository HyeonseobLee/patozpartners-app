import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRepairCases } from '../../context/RepairCasesContext';
import { QueueStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';

type Props = NativeStackScreenProps<QueueStackParamList, 'QueueHome'>;

const FILTERS = ['전체', '점검대기', '수리 진행 중', '수리 완료', '수령 완료'] as const;
type Filter = (typeof FILTERS)[number];

export const QueueScreen = ({ navigation }: Props) => {
  const { cases } = useRepairCases();
  const [filter, setFilter] = useState<Filter>('전체');
  const [query, setQuery] = useState('');

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return cases.filter((item) => new Date(item.intakeAt).toDateString() === today).length;
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...cases]
      .filter((item) => (filter === '전체' ? true : item.status === filter))
      .filter((item) => {
        if (!normalized) return true;
        return [item.customerName, item.deviceModel, item.serialNumber, item.intakeNumber]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      })
      .sort((a, b) => {
        const aDone = a.status === '수령 완료' ? 1 : 0;
        const bDone = b.status === '수령 완료' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return +new Date(b.intakeAt) - +new Date(a.intakeAt);
      });
  }, [cases, filter, query]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘 접수 {todayCount}건</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((item) => {
          const selected = item === filter;
          return (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, selected && styles.filterChipActive]}>
              <Text style={[styles.filterText, selected && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <TextInput
        style={styles.searchInput}
        placeholder="고객명/기기명/시리얼/접수번호 검색"
        value={query}
        onChangeText={setQuery}
      />

      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredCases.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() => navigation.push('RepairManageDetail', { caseId: item.id })}
          >
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbText}>IMG</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.deviceModel}</Text>
              <Text style={styles.meta}>고객: {item.customerName ?? '미입력'}</Text>
              <Text style={styles.meta}>시리얼: {item.serialNumber}</Text>
              <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
              <Text style={styles.meta}>접수시각: {new Date(item.intakeAt).toLocaleString()}</Text>
            </View>
            <StatusBadge status={item.status} />
          </Pressable>
        ))}
      </ScrollView>
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
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterRow: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.white,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  thumbPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
