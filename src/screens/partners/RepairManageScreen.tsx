import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { useRepairCases } from '../../context/RepairCasesContext';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';
import { StatusStepBar } from '../../components/partners/StatusStepBar';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairManageDetail'>;

export const RepairManageScreen = ({ route }: Props) => {
  const { caseId } = route.params;
  const { findCase, addRepairItem, toggleRepairItem, goToNextStatus, goToPrevStatus, sendEstimate } = useRepairCases();
  const item = findCase(caseId);

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [expectedHours, setExpectedHours] = useState('');
  const [actualHours, setActualHours] = useState('');
  const [estimateAmount, setEstimateAmount] = useState(String(item?.estimate?.amount ?? ''));
  const [estimateNote, setEstimateNote] = useState(item?.estimate?.note ?? '');

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

  const onSendEstimate = () => {
    const amount = Number(estimateAmount);
    if (!amount) return;
    sendEstimate(item.id, amount, estimateNote);
    Alert.alert('견적 전송', '견적이 고객에게 전달되었습니다');
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
        <Text style={styles.sectionTitle}>작업 내용 추가</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="항목명 (예: 브레이크 패드 교체)" />
        <TextInput value={note} onChangeText={setNote} style={styles.input} placeholder="메모" />
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
        <Pressable style={styles.secondaryButton} onPress={onAddRepairItem}>
          <Text style={styles.secondaryButtonText}>수리 항목 추가</Text>
        </Pressable>

        {item.repairItems.map((repairItem) => (
          <Pressable key={repairItem.id} style={styles.itemRow} onPress={() => toggleRepairItem(item.id, repairItem.id)}>
            <View style={[styles.checkbox, repairItem.done && styles.checkboxOn]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{repairItem.title}</Text>
              {!!repairItem.note && <Text style={styles.itemMeta}>{repairItem.note}</Text>}
            </View>
            <Text style={styles.itemMeta}>{repairItem.done ? '완료' : '진행중'}</Text>
          </Pressable>
        ))}
      </View>

      {item.status === '견적 전달' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>견적 전달</Text>
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
          <Pressable style={styles.secondaryButton} onPress={onSendEstimate}>
            <Text style={styles.secondaryButtonText}>고객에게 견적 보내기</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <Pressable style={styles.lightButton} onPress={() => goToPrevStatus(item.id)}>
          <Text style={styles.lightButtonText}>이전 단계</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => goToNextStatus(item.id)}>
          <Text style={styles.primaryButtonText}>다음 단계로</Text>
        </Pressable>
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
  lightButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  lightButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  primaryButton: {
    flex: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.brand,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
});
