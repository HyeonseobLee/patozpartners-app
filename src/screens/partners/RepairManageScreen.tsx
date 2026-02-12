import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { RepairStatus, STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';
import { StatusStepBar } from '../../components/partners/StatusStepBar';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairManageDetail'>;

export const RepairStatusUpdateScreen = ({ route }: Props) => {
  const { caseId } = route.params;
  const { findCase, addRepairItem, saveEta, toggleRepairItem, setStatus, sendEstimate, confirmEstimateByConsumer } = useRepairCases();
  const item = findCase(caseId);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [expectedHours, setExpectedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [etaText, setEtaText] = useState(item?.etaText ?? '');
  const [estimateAmount, setEstimateAmount] = useState('');
  const [estimateNote, setEstimateNote] = useState('');

  const confirmedEstimate = useMemo(
    () => item?.estimates.find((estimate) => estimate.consumerConfirmed),
    [item?.estimates],
  );

  if (!item) {
    return (
      <View style={styles.emptyWrap}>
        <Text>수리 케이스가 없습니다.</Text>
      </View>
    );
  }

  const onAddRepairItem = () => {
    if (!title.trim()) return;
    addRepairItem(item.id, {
      title,
      note,
      expectedHours: expectedHours ? Number(expectedHours) : undefined,
      actualHours: actualHours ? Number(actualHours) : undefined,
      done: false,
    });
    setTitle('');
    setNote('');
    setExpectedHours('');
    setActualHours('');
  };

  const onSaveEta = () => {
    saveEta(item.id, etaText);
    Alert.alert('저장 완료', '완료 예정 시간이 소비자 앱 타임라인에 반영됩니다.');
  };

  const onSendEstimate = async (additional = false) => {
    const amount = Number(estimateAmount);
    if (!amount) return;
    await sendEstimate(item.id, amount, estimateNote, { additional });
    setEstimateAmount('');
    setEstimateNote('');
    Alert.alert('견적 전송', additional ? '추가 견적이 고객에게 전달되었습니다.' : '견적이 고객에게 전달되었습니다.');
  };

  const onSelectStatus = (status: RepairStatus) => {
    const updated = setStatus(item.id, status);
    if (!updated && status === 'PARTS_PENDING') {
      Alert.alert('견적 확정 필요', '소비자가 견적 리스트 중 하나를 확정해야 부품 준비 단계로 이동할 수 있습니다.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{item.deviceModel}</Text>
        <Text style={styles.meta}>시리얼: {item.serialNumber}</Text>
        <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
        <StatusStepBar status={item.status} />
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>수리 상태 변경 (5단계 동기화)</Text>
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
        <Text style={styles.sectionTitle}>수리 항목 및 완료 예정 시간</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="항목명 (예: 타이어 교체)" />
        <TextInput value={note} onChangeText={setNote} style={styles.input} placeholder="작업 상세 메모" />
        <View style={styles.row}>
          <TextInput
            value={expectedHours}
            onChangeText={setExpectedHours}
            style={[styles.input, styles.flex1]}
            placeholder="예상 시간"
            keyboardType="numeric"
          />
          <TextInput
            value={actualHours}
            onChangeText={setActualHours}
            style={[styles.input, styles.flex1]}
            placeholder="실제 시간"
            keyboardType="numeric"
          />
        </View>
        <TextInput value={etaText} onChangeText={setEtaText} style={styles.input} placeholder="완료 예정 시간 (예: 오늘 18:30)" />
        <View style={styles.row}>
          <Pressable style={[styles.secondaryButton, styles.flex1]} onPress={onAddRepairItem}>
            <Text style={styles.secondaryButtonText}>수리 항목 추가</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.flex1]} onPress={onSaveEta}>
            <Text style={styles.secondaryButtonText}>완료 예정 저장</Text>
          </Pressable>
        </View>

        {item.repairItems.map((repairItem) => (
          <Pressable key={repairItem.id} style={styles.itemRow} onPress={() => toggleRepairItem(item.id, repairItem.id)}>
            <View style={[styles.checkbox, repairItem.done && styles.checkboxOn]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{repairItem.title}</Text>
              {!!repairItem.note && <Text style={styles.itemMeta}>{repairItem.note}</Text>}
              {!!repairItem.completedAt && <Text style={styles.itemMeta}>완료 시각: {new Date(repairItem.completedAt).toLocaleString()}</Text>}
            </View>
            <Text style={styles.itemMeta}>{repairItem.done ? '완료' : '진행중'}</Text>
          </Pressable>
        ))}
      </View>

      {(item.status === 'INSPECTING' || item.status === 'PARTS_PENDING') && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>견적서 선발송</Text>
          <TextInput
            value={estimateAmount}
            onChangeText={setEstimateAmount}
            keyboardType="numeric"
            style={styles.input}
            placeholder="견적 금액"
          />
          <TextInput
            value={estimateNote}
            onChangeText={setEstimateNote}
            style={[styles.input, { minHeight: 80 }]}
            multiline
            placeholder="견적 요약 메모"
          />
          <Pressable style={styles.primaryButton} onPress={() => onSendEstimate(item.status === 'PARTS_PENDING')}>
            <Text style={styles.primaryButtonText}>{item.status === 'INSPECTING' ? '고객에게 견적 보내기' : '고객에게 추가 견적 보내기'}</Text>
          </Pressable>

          <View style={styles.quoteListWrap}>
            <Text style={styles.quoteTitle}>전송된 견적 리스트</Text>
            {item.estimates.length === 0 && <Text style={styles.meta}>전송된 견적이 없습니다.</Text>}
            {item.estimates.map((estimate) => {
              const selected = estimate.consumerConfirmed;
              return (
                <View key={estimate.id} style={[styles.quoteCard, selected && styles.quoteCardSelected]}>
                  <Text style={styles.itemTitle}>{estimate.amount.toLocaleString()}원</Text>
                  <Text style={styles.itemMeta}>{estimate.note}</Text>
                  <Text style={styles.itemMeta}>전송 시각: {new Date(estimate.sentAt).toLocaleString()}</Text>
                  <Text style={styles.itemMeta}>{selected ? `소비자 확정: ${new Date(estimate.consumerConfirmedAt ?? '').toLocaleString()}` : '소비자 미확정'}</Text>
                  {!selected && (
                    <Pressable style={styles.confirmButton} onPress={() => confirmEstimateByConsumer(item.id, estimate.id)}>
                      <Text style={styles.confirmButtonText}>소비자 확정 처리(연동 시뮬레이션)</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
          {!!confirmedEstimate && <Text style={styles.meta}>확정 견적: {confirmedEstimate.amount.toLocaleString()}원</Text>}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>소비자 앱 타임라인 반영 데이터</Text>
        {item.timeline.slice().reverse().map((timelinePoint) => (
          <View key={`${timelinePoint.status}-${timelinePoint.updatedAt}`} style={styles.timelineRow}>
            <Text style={styles.itemTitle}>{timelinePoint.statusLabel}</Text>
            <Text style={styles.itemMeta}>{new Date(timelinePoint.updatedAt).toLocaleString()}</Text>
            <Text style={styles.itemMeta}>
              작업 항목: {timelinePoint.completedRepairItems.length ? timelinePoint.completedRepairItems.join(', ') : '완료된 작업 없음'}
            </Text>
          </View>
        ))}
      </View>

      {(item.repairCompletedAt || item.pickupCompletedAt) && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>완료 시간 기록</Text>
          {!!item.repairCompletedAt && <Text style={styles.meta}>수리 완료: {new Date(item.repairCompletedAt).toLocaleString()}</Text>}
          {!!item.pickupCompletedAt && <Text style={styles.meta}>수령 완료: {new Date(item.pickupCompletedAt).toLocaleString()}</Text>}
        </View>
      )}
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
  row: { flexDirection: 'row', gap: spacing.xs },
  flex1: { flex: 1 },
  secondaryButton: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: { color: colors.brand, fontWeight: '700' },
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
  confirmButton: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.royalBlueDark,
  },
  confirmButtonText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  timelineRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.royalBlue,
    paddingLeft: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xxs,
  },
});
