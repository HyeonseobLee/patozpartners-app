import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { RepairStatus, STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';
import { StatusStepBar } from '../../components/partners/StatusStepBar';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairManageDetail'>;

export const RepairStatusUpdateScreen = ({ route }: Props) => {
  const { caseId } = route.params;
  const { findCase, saveEta, toggleRepairItem, setStatus, sendEstimate } = useRepairCases();
  const item = findCase(caseId);

  const [estimateAmount, setEstimateAmount] = useState('');
  const [estimateNote, setEstimateNote] = useState('');
  const [expectedTimeText, setExpectedTimeText] = useState(item?.expectedTimeText ?? '');
  const [actualTimeText, setActualTimeText] = useState(item?.actualTimeText ?? '');


  if (!item) {
    return (
      <View style={styles.emptyWrap}>
        <Text>수리 케이스가 없습니다.</Text>
      </View>
    );
  }

  const onSaveTimes = () => {
    saveEta(item.id, expectedTimeText, { actualTimeText, checklistReady: true });
  };

  const onSendEstimate = async () => {
    const amount = Number(estimateAmount);
    if (!amount) return;
    await sendEstimate(item.id, amount, estimateNote);
    setEstimateAmount('');
    setEstimateNote('');
  };

  const onSelectStatus = (status: RepairStatus) => {
    if (status === item.status) return;
    setStatus(item.id, status);
  };

  const canShowRepairItems = item.status !== 'RECEIVED' || !!item.repairChecklistReady;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{item.deviceModel}</Text>
        <Text style={styles.meta}>시리얼: {item.serialNumber}</Text>
        <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>진행 단계</Text>
        <StatusStepBar status={item.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>상태 변경</Text>
        <View style={styles.statusWrap}>
          {STATUS_FLOW.map((status) => {
            const selected = status === item.status;
            return (
              <Pressable key={status} style={[styles.statusButton, selected && styles.statusButtonActive]} onPress={() => onSelectStatus(status)}>
                <Text style={[styles.statusButtonText, selected && styles.statusButtonTextActive]}>{STATUS_LABEL[status]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>예상/실제 시간</Text>
        <TextInput
          value={expectedTimeText}
          onChangeText={setExpectedTimeText}
          style={styles.input}
          placeholder="예상 시간 (예: 2026-02-12 15:00)"
        />
        <TextInput
          value={actualTimeText}
          onChangeText={setActualTimeText}
          style={styles.input}
          placeholder="실제 시간 (예: 2026-02-12 16:20)"
        />
        <Pressable style={styles.primaryButton} onPress={onSaveTimes}>
          <Text style={styles.primaryButtonText}>저장</Text>
        </Pressable>
      </View>

      {canShowRepairItems && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>수리 항목</Text>
          {item.repairItems.map((repairItem) => (
            <Pressable key={repairItem.id} style={styles.itemRow} onPress={() => toggleRepairItem(item.id, repairItem.id)}>
              <View style={[styles.checkbox, repairItem.done && styles.checkboxOn]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{repairItem.title}</Text>
                {!!repairItem.note && <Text style={styles.itemMeta}>{repairItem.note}</Text>}
                {!!repairItem.completedAt && <Text style={styles.itemMeta}>완료 시각: {new Date(repairItem.completedAt).toLocaleString()}</Text>}
              </View>
              <Text style={styles.itemMeta}>{repairItem.done ? '완료' : '미완료'}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>견적 전송/확인</Text>
        <TextInput value={estimateAmount} onChangeText={setEstimateAmount} style={styles.input} placeholder="견적 금액" keyboardType="numeric" />
        <TextInput value={estimateNote} onChangeText={setEstimateNote} style={styles.input} placeholder="견적 메모" />
        <Pressable style={styles.primaryButton} onPress={onSendEstimate}>
          <Text style={styles.primaryButtonText}>견적 전송</Text>
        </Pressable>

        <View style={styles.quoteListWrap}>
          <Text style={styles.quoteTitle}>전송된 견적 리스트</Text>
          {item.estimates.length === 0 && <Text style={styles.meta}>전송된 견적이 없습니다.</Text>}
          {item.estimates.map((estimate) => {
            const selected = estimate.id === item.selectedEstimateId;
            return (
              <View key={estimate.id} style={[styles.quoteCard, selected && styles.quoteCardSelected]}>
                <Text style={styles.itemTitle}>{estimate.amount.toLocaleString()}원</Text>
                <Text style={styles.itemMeta}>{estimate.note}</Text>
                <Text style={styles.itemMeta}>전송 시각: {new Date(estimate.sentAt).toLocaleString()}</Text>
                <Text style={styles.itemMeta}>{selected ? '선택된 견적' : '일반 견적'}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export const RepairManageScreen = RepairStatusUpdateScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statusButton: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  statusButtonActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  statusButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  statusButtonTextActive: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderSoft,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  itemTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  itemMeta: { fontSize: 12, color: colors.textSecondary },
  primaryButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.brand,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
  quoteListWrap: { gap: spacing.xs },
  quoteTitle: { color: colors.textPrimary, fontWeight: '700' },
  quoteCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  quoteCardSelected: { borderColor: colors.royalBlue, backgroundColor: colors.royalBlueSoft },
});
