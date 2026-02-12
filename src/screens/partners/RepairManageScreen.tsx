import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { RepairStatus, STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';
import { StatusStepBar } from '../../components/partners/StatusStepBar';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairManageDetail'>;

const buildDateOptions = () => {
  const now = new Date();
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() + idx);
    return {
      value: date.toISOString().slice(0, 10),
      label: `${date.getMonth() + 1}/${date.getDate()} (${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]})`,
    };
  });
};

const TIME_OPTIONS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

export const RepairStatusUpdateScreen = ({ route }: Props) => {
  const { caseId } = route.params;
  const { findCase, saveEta, toggleRepairItem, setStatus, sendEstimate, confirmEstimateByConsumer } = useRepairCases();
  const item = findCase(caseId);

  const [estimateAmount, setEstimateAmount] = useState('');
  const [estimateNote, setEstimateNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dateOptions = useMemo(() => buildDateOptions(), []);
  const [etaDate, setEtaDate] = useState(dateOptions[0]?.value ?? '');
  const [etaTime, setEtaTime] = useState(TIME_OPTIONS[0]);

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

  const onCompleteEtaInput = () => {
    const etaText = `${etaDate} ${etaTime}`;
    saveEta(item.id, etaText, { checklistReady: true });
    Alert.alert('입력 완료', '완료 예정 일시가 저장되었고 수리 항목 영역이 활성화되었습니다.');
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
    if (status === item.status) return;

    Alert.alert('상태 변경', `상태를 ${STATUS_LABEL[status]}로 변경하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        style: 'default',
        onPress: () => {
          const updated = setStatus(item.id, status);
          if (!updated && status === 'INSPECTING') {
            Alert.alert('견적 확정 필요', '소비자가 견적을 수락한 뒤에만 점검 중 단계로 이동할 수 있습니다.');
          }
        },
      },
    ]);
  };

  const canShowRepairItems = item.status === 'INSPECTING' || item.status === 'REPAIR_COMPLETED' || item.status === 'PICKUP_COMPLETED' || !!item.repairChecklistReady;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{item.deviceModel}</Text>
        <Text style={styles.meta}>시리얼: {item.serialNumber}</Text>
        <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>진행 단계 및 상태 변경</Text>
        <StatusStepBar status={item.status} />
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
        <Text style={styles.sectionTitle}>완료 예정 일시</Text>

        <Pressable style={styles.pickerBox} onPress={() => setShowDatePicker((prev) => !prev)}>
          <Text style={styles.pickerLabel}>날짜 선택</Text>
          <Text style={styles.pickerValue}>{dateOptions.find((option) => option.value === etaDate)?.label ?? '날짜를 선택하세요'}</Text>
        </Pressable>
        {showDatePicker && (
          <View style={styles.dropdownList}>
            {dateOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.dropdownItem, etaDate === option.value && styles.dropdownItemActive]}
                onPress={() => {
                  setEtaDate(option.value);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.pickerBox} onPress={() => setShowTimePicker((prev) => !prev)}>
          <Text style={styles.pickerLabel}>시간 선택</Text>
          <Text style={styles.pickerValue}>{etaTime}</Text>
        </Pressable>
        {showTimePicker && (
          <View style={styles.dropdownList}>
            {TIME_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.dropdownItem, etaTime === option && styles.dropdownItemActive]}
                onPress={() => {
                  setEtaTime(option);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.dropdownText}>{option}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={onCompleteEtaInput}>
          <Text style={styles.primaryButtonText}>입력 완료</Text>
        </Pressable>
        {!!item.etaText && <Text style={styles.meta}>저장된 완료 예정: {item.etaText}</Text>}
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
        <Pressable style={styles.primaryButton} onPress={() => onSendEstimate(false)}>
          <Text style={styles.primaryButtonText}>견적 전송</Text>
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
  pickerBox: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  pickerLabel: { fontSize: 12, color: colors.textSecondary },
  pickerValue: { marginTop: 2, color: colors.textPrimary, fontWeight: '600' },
  dropdownList: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white },
  dropdownItemActive: { backgroundColor: colors.brandSoft },
  dropdownText: { color: colors.textPrimary },
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
