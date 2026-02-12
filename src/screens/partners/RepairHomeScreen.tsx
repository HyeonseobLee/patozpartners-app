import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RepairStatus, STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairHome'>;

export const RepairHomeScreen = ({ navigation }: Props) => {
  const { cases } = useRepairCases();
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | RepairStatus>('ALL');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredCases = useMemo(() => {
    const manageableCases = cases.filter((item) => item.status !== 'NEW_REQUEST');
    if (selectedStatus === 'ALL') {
      return manageableCases;
    }
    return manageableCases.filter((item) => item.status === selectedStatus);
  }, [cases, selectedStatus]);

  const filterStatuses = useMemo(() => STATUS_FLOW.filter((status) => status !== 'NEW_REQUEST'), []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.filterWrap}>
        <Text style={styles.filterLabel}>상태 필터</Text>
        <Pressable style={styles.dropdownButton} onPress={() => setDropdownOpen((prev) => !prev)}>
          <Text style={styles.dropdownText}>{selectedStatus === 'ALL' ? '전체 상태' : STATUS_LABEL[selectedStatus]}</Text>
          <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
        </Pressable>
        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            <Pressable
              style={[styles.dropdownOption, selectedStatus === 'ALL' && styles.dropdownOptionActive]}
              onPress={() => {
                setSelectedStatus('ALL');
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>전체 상태</Text>
            </Pressable>
            {filterStatuses.map((status) => (
              <Pressable
                key={status}
                style={[styles.dropdownOption, selectedStatus === status && styles.dropdownOptionActive]}
                onPress={() => {
                  setSelectedStatus(status);
                  setDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{STATUS_LABEL[status]}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {filteredCases.map((item) => {
        const isPriority = item.status === 'NEW_REQUEST' || item.status === 'ESTIMATE_ACCEPTED';
        return (
          <Pressable
            key={item.id}
            style={[styles.card, isPriority && styles.priorityCard, item.status === 'NEW_REQUEST' && styles.newRequestCard, item.status === 'ESTIMATE_ACCEPTED' && styles.estimateAcceptedCard]}
            onPress={() => navigation.push('RepairManageDetail', { caseId: item.id })}
          >
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <Text style={styles.model}>{item.deviceModel}</Text>
              <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
              <Text style={styles.meta}>고객명: {item.customerName ?? '미입력'}</Text>
              <Text style={styles.meta}>연락처: {item.customerPhone ?? '미입력'}</Text>
              <View style={styles.issueBox}>
                <Text style={styles.issueTitle}>고장 내역</Text>
                <Text style={styles.issueText}>{item.requestNote ?? '소비자 고장 내역이 없습니다.'}</Text>
              </View>
            </View>
            <Text style={[styles.statusText, statusTone[item.status]]}>{STATUS_LABEL[item.status]}</Text>
          </Pressable>
        );
      })}

      {filteredCases.length === 0 && <Text style={styles.emptyText}>선택한 상태의 요청이 없습니다.</Text>}
    </ScrollView>
  );
};

const statusTone: Record<RepairStatus, { color: string }> = {
  NEW_REQUEST: { color: '#D97706' },
  ESTIMATE_PENDING: { color: '#2563EB' },
  ESTIMATE_ACCEPTED: { color: '#059669' },
  INTAKE_COMPLETED: { color: '#7C3AED' },
  IN_REPAIR: { color: '#0F766E' },
  REPAIR_COMPLETED: { color: '#1D4ED8' },
  SHIPMENT_COMPLETED: { color: '#166534' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  filterWrap: { gap: spacing.xs, zIndex: 10 },
  filterLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  dropdownButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { color: colors.textPrimary, fontWeight: '600' },
  dropdownArrow: { color: colors.textSecondary, fontSize: 12 },
  dropdownMenu: {
    marginTop: spacing.xxs,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  dropdownOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  dropdownOptionActive: { backgroundColor: colors.brandSoft },
  dropdownOptionText: { color: colors.textPrimary, fontWeight: '500' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityCard: {
    borderWidth: 2,
    borderColor: colors.royalBlue,
    backgroundColor: '#F8FAFF',
  },
  newRequestCard: {
    backgroundColor: '#FFFBEB',
  },
  estimateAcceptedCard: {
    borderColor: '#1D4ED8',
    borderWidth: 3,
    backgroundColor: '#EFF6FF',
  },
  model: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { color: colors.textSecondary, fontSize: 12 },
  issueBox: {
    marginTop: spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
  },
  issueTitle: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  issueText: { fontSize: 12, lineHeight: 16, color: colors.textPrimary },
  statusText: { fontWeight: '800', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: spacing.md, color: colors.textSecondary },
});
