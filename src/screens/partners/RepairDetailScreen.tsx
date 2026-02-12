import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STATUS_FLOW, STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusStepBar } from '../../components/partners/StatusStepBar';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairManageDetail'>;

const createDateList = () => {
  const list: string[] = [];
  const base = new Date();
  for (let i = 0; i < 21; i += 1) {
    const target = new Date(base);
    target.setDate(base.getDate() + i);
    list.push(target.toISOString().slice(0, 10));
  }
  return list;
};

const timeSlots = Array.from({ length: 48 }, (_, idx) => `${Math.floor(idx / 2).toString().padStart(2, '0')}:${idx % 2 === 0 ? '00' : '30'}`);

export const RepairDetailScreen = ({ route }: Props) => {
  const { caseId } = route.params;
  const { cases, findCase, saveCompletionDueAt, toggleRepairItem, goToNextStatus, canManuallyMoveToNextStatus, getNextStatus, sendEstimate, addRepairItem, acceptEstimate } = useRepairCases();
  const item = findCase(caseId);

  const [estimateAmount, setEstimateAmount] = useState('');
  const [estimateNote, setEstimateNote] = useState('');
  const [dueDate, setDueDate] = useState(item?.completionDueAt?.slice(0, 10) ?? '');
  const [dueTime, setDueTime] = useState(item?.completionDueAt?.slice(11, 16) ?? '09:00');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemNote, setNewItemNote] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);

  const upcomingDates = useMemo(() => createDateList(), []);

  if (!item) {
    return (
      <View style={styles.emptyWrap}>
        <Text>수리 케이스가 없습니다.</Text>
      </View>
    );
  }

  const statusIdx = STATUS_FLOW.indexOf(item.status);
  const intakeCompletedIndex = STATUS_FLOW.indexOf('INTAKE_COMPLETED');
  const repairCompletedIndex = STATUS_FLOW.indexOf('REPAIR_COMPLETED');
  const nextStatus = getNextStatus(item);
  const canManuallyMove = canManuallyMoveToNextStatus(item);
  const canShowDueDate = statusIdx >= intakeCompletedIndex && statusIdx < repairCompletedIndex;
  const canShowRepairItems = statusIdx >= intakeCompletedIndex;
  const canShowEstimateComposer = statusIdx < STATUS_FLOW.indexOf('ESTIMATE_ACCEPTED');
  const isRepairCompletedOrLater = statusIdx >= repairCompletedIndex;

  const serialHistory = useMemo(() => {
    const sameSerialHistory = cases
      .filter((repairCase) => repairCase.id !== item.id && repairCase.serialNumber === item.serialNumber)
      .flatMap((repairCase) => repairCase.repairHistory);

    return [...item.repairHistory, ...sameSerialHistory].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [cases, item.id, item.repairHistory, item.serialNumber]);

  const visibleHistory = showFullHistory ? serialHistory : serialHistory.slice(0, 2);

  const onManualNextStatus = () => {
    if (!nextStatus) return;

    const isRepairCompletionTransition = item.status === 'IN_REPAIR' && nextStatus === 'REPAIR_COMPLETED';
    const hasIncompleteRepairItems = item.repairItems.some((repairItem) => !repairItem.done);

    if (isRepairCompletionTransition && hasIncompleteRepairItems) {
      Alert.alert('상태 변경 불가', '모든 수리 항목이 완료되어야 수리 완료 상태로 넘어갈 수 있습니다');
      return;
    }

    Alert.alert('상태 변경', `상태를 ${STATUS_LABEL[nextStatus]}로 변경하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '변경',
        onPress: () => {
          goToNextStatus(item.id);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.modelTitle}>{item.deviceModel}</Text>
        <Text style={styles.meta}>시리얼: {item.serialNumber}</Text>
        <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
        <Text style={styles.meta}>고객명: {item.customerName ?? '미입력'}</Text>
        <Text style={styles.meta}>연락처: {item.customerPhone ?? '미입력'}</Text>
      </View>

      <View style={styles.issueCard}>
        <Text style={styles.issueHeading}>고장 내역</Text>
        <Text style={styles.issueDescription}>{item.requestNote ?? '소비자 고장 내역이 없습니다.'}</Text>
      </View>

      <View style={styles.card}>
        <StatusStepBar status={item.status} />
        {canManuallyMove && nextStatus ? (
          <Pressable style={styles.primaryButton} onPress={onManualNextStatus}>
            <Text style={styles.primaryButtonText}>다음 단계로 변경 ({STATUS_LABEL[nextStatus]})</Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>현재 단계에서는 상태를 수동으로 변경할 수 없습니다.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>전송된 견적 리스트</Text>
        {item.estimates.length === 0 && <Text style={styles.meta}>전송된 견적이 없습니다.</Text>}
        {item.estimates.map((estimate) => {
          const selected = estimate.id === item.selectedEstimateId;
          return (
            <View key={estimate.id} style={[styles.quoteCard, selected && styles.quoteCardSelected]}>
              <Text style={styles.itemTitle}>{estimate.amount.toLocaleString()}원</Text>
              <Text style={styles.itemMeta}>{estimate.note}</Text>
              <Text style={styles.itemMeta}>전송 시각: {new Date(estimate.sentAt).toLocaleString()}</Text>
              {item.status === 'ESTIMATE_PENDING' && (
                <Pressable style={styles.quoteAcceptButton} onPress={() => acceptEstimate(item.id, estimate.id)}>
                  <Text style={styles.quoteAcceptButtonText}>소비자 수락 처리</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {canShowEstimateComposer && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>견적 전송</Text>
          <TextInput value={estimateAmount} onChangeText={setEstimateAmount} style={styles.input} placeholder="견적 금액" keyboardType="numeric" />
          <TextInput value={estimateNote} onChangeText={setEstimateNote} style={styles.input} placeholder="견적 메모" />
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              const amount = Number(estimateAmount);
              if (!amount) return;
              await sendEstimate(item.id, amount, estimateNote);
              setEstimateAmount('');
              setEstimateNote('');
            }}
          >
            <Text style={styles.primaryButtonText}>견적 전송</Text>
          </Pressable>
        </View>
      )}

      {canShowDueDate && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>완료 예정 일시</Text>
          <View style={styles.layerWrapHigh}>
            <Pressable style={styles.selectorButton} onPress={() => setShowCalendar((prev) => !prev)}>
              <Text style={styles.selectorText}>{dueDate || '완료 예정 날짜 선택'}</Text>
              <Text style={styles.selectorIcon}>{showCalendar ? '▲' : '▼'}</Text>
            </Pressable>
            {showCalendar && (
              <ScrollView style={styles.pickerMenu} nestedScrollEnabled>
                {upcomingDates.map((date) => (
                  <Pressable
                    key={date}
                    style={[styles.pickerOption, dueDate === date && styles.pickerOptionActive]}
                    onPress={() => {
                      setDueDate(date);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{date}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.layerWrapLow}>
            <Pressable style={styles.selectorButton} onPress={() => setShowTimePicker((prev) => !prev)}>
              <Text style={styles.selectorText}>{dueTime || '완료 예정 시간 선택'}</Text>
              <Text style={styles.selectorIcon}>{showTimePicker ? '▲' : '▼'}</Text>
            </Pressable>
            {showTimePicker && (
              <ScrollView style={styles.pickerMenu} nestedScrollEnabled>
                {timeSlots.map((slot) => (
                  <Pressable
                    key={slot}
                    style={[styles.pickerOption, dueTime === slot && styles.pickerOptionActive]}
                    onPress={() => {
                      setDueTime(slot);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{slot}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              if (!dueDate || !dueTime) return;
              saveCompletionDueAt(item.id, `${dueDate}T${dueTime}:00.000Z`);
            }}
          >
            <Text style={styles.primaryButtonText}>완료 예정 일시 저장</Text>
          </Pressable>
        </View>
      )}

      {canShowRepairItems && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>수리 항목</Text>
          {item.repairItems.map((repairItem) => (
            <Pressable
              key={repairItem.id}
              disabled={isRepairCompletedOrLater}
              style={[styles.itemRow, repairItem.done && styles.itemRowDone, isRepairCompletedOrLater && styles.disabledRow]}
              onPress={() => toggleRepairItem(item.id, repairItem.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, repairItem.done && styles.itemTitleDone]}>{repairItem.title}</Text>
                {!!repairItem.note && <Text style={[styles.itemMeta, repairItem.done && styles.itemMetaDone]}>{repairItem.note}</Text>}
                {!!repairItem.completedAt && <Text style={styles.itemMeta}>완료 시각: {new Date(repairItem.completedAt).toLocaleString()}</Text>}
              </View>
              <Text style={[styles.itemStateText, repairItem.done && styles.itemStateTextDone]}>{repairItem.done ? '완료 ✓' : '미완료'}</Text>
            </Pressable>
          ))}

          {!isRepairCompletedOrLater && (
            <View style={styles.addItemWrap}>
              <TextInput value={newItemTitle} onChangeText={setNewItemTitle} style={styles.input} placeholder="수리 항목 이름" />
              <TextInput value={newItemNote} onChangeText={setNewItemNote} style={styles.input} placeholder="메모 (선택)" />
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  addRepairItem(item.id, { title: newItemTitle, note: newItemNote });
                  setNewItemTitle('');
                  setNewItemNote('');
                }}
              >
                <Text style={styles.secondaryButtonText}>수리 항목 추가</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>과거 수리 이력</Text>
        {visibleHistory.map((history, idx) => (
          <View key={`${history.date}-${history.repairItem}-${idx}`} style={styles.historyItem}>
            <Text style={styles.historyDate}>{history.date}</Text>
            <Text style={styles.historyRepair}>{history.repairItem}</Text>
            <Text style={styles.historyMemo}>담당자 메모: {history.memo}</Text>
          </View>
        ))}
        {serialHistory.length === 0 && <Text style={styles.meta}>동일 시리얼의 과거 수리 이력이 없습니다.</Text>}
        {serialHistory.length > 2 && (
          <Pressable style={styles.secondaryButton} onPress={() => setShowFullHistory((prev) => !prev)}>
            <Text style={styles.secondaryButtonText}>{showFullHistory ? '접기' : `더보기 (${serialHistory.length - 2}건)`}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl + spacing.md },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSoft, padding: spacing.md, gap: spacing.sm, overflow: 'visible' },
  issueCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: spacing.md,
    gap: spacing.xs,
  },
  issueHeading: { fontSize: 18, fontWeight: '800', color: '#3730A3' },
  issueDescription: { fontSize: 14, lineHeight: 20, color: colors.textPrimary, fontWeight: '600' },
  modelTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  selectorButton: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, minHeight: 46, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white },
  selectorText: { color: colors.textPrimary, fontWeight: '600' },
  selectorIcon: { color: colors.textSecondary },
  layerWrapHigh: { zIndex: 40, gap: spacing.xs },
  layerWrapLow: { zIndex: 30, gap: spacing.xs },
  pickerMenu: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, maxHeight: 200, backgroundColor: colors.white, paddingVertical: spacing.xxs },
  pickerOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, minHeight: 42, justifyContent: 'center' },
  pickerOptionActive: { backgroundColor: colors.brandSoft },
  pickerOptionText: { color: colors.textPrimary },
  input: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 46 },
  itemRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.sm, backgroundColor: colors.white },
  disabledRow: { opacity: 0.55 },
  itemRowDone: { borderColor: '#16A34A', backgroundColor: '#ECFDF5' },
  itemTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  itemTitleDone: { color: '#166534' },
  itemMeta: { fontSize: 12, color: colors.textSecondary },
  itemMetaDone: { color: '#15803D' },
  itemStateText: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  itemStateTextDone: { color: '#15803D' },
  primaryButton: { borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.brand, minHeight: 44, justifyContent: 'center' },
  secondaryButton: { borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.royalBlueSoft, minHeight: 44, justifyContent: 'center' },
  addItemWrap: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  secondaryButtonText: { color: colors.royalBlue, fontWeight: '700' },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
  quoteCard: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSoft, padding: spacing.sm, gap: spacing.xxs },
  quoteCardSelected: { borderColor: colors.royalBlue, backgroundColor: colors.royalBlueSoft },
  quoteAcceptButton: { marginTop: spacing.xs, borderWidth: 1, borderColor: colors.royalBlue, borderRadius: radius.md, paddingVertical: spacing.xs, alignItems: 'center' },
  quoteAcceptButtonText: { color: colors.royalBlue, fontWeight: '700', fontSize: 12 },
  historyItem: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.md, padding: spacing.sm, gap: spacing.xxs, backgroundColor: '#F9FAFB' },
  historyDate: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  historyRepair: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  historyMemo: { color: colors.textSecondary, fontSize: 12 },
});

export const RepairManageScreen = RepairDetailScreen;
