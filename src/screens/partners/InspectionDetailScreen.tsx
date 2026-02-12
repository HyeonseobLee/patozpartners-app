import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Inspection, useRepairCases } from '../../context/RepairCasesContext';
import { InspectionStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';

type Props = NativeStackScreenProps<InspectionStackParamList, 'InspectionDetail'>;

const checks: Array<keyof Inspection> = ['brake', 'tire', 'battery', 'drivetrain', 'other'];
const checkLabel: Record<string, string> = {
  brake: '브레이크',
  tire: '타이어',
  battery: '배터리',
  drivetrain: '구동계',
  other: '기타',
};

export const InspectionDetailScreen = ({ route, navigation }: Props) => {
  const { caseId } = route.params;
  const { findCase, saveInspection } = useRepairCases();
  const item = findCase(caseId);

  const [form, setForm] = useState<Inspection>(
    item?.inspection ?? {
      brake: false,
      tire: false,
      battery: false,
      drivetrain: false,
      other: false,
      memo: '',
      otherText: '',
    },
  );

  const chatHint = useMemo(
    () => [
      '고객: 제동 시 소음이 들려요.',
      '정비사: 브레이크/구동계 점검 후 안내드릴게요.',
      '고객: 배터리 지속시간도 짧아졌어요.',
    ],
    [],
  );

  if (!item) {
    return (
      <View style={styles.emptyWrap}>
        <Text>해당 수리건을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const onSaveAndMove = () => {
    saveInspection(item.id, form);
    Alert.alert('점검 저장', '점검 결과가 저장되었습니다.');
    navigation.push('RepairManageDetail', { caseId: item.id });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>점검 체크리스트</Text>
      <Text style={styles.subtitle}>{item.deviceModel} · {item.serialNumber}</Text>

      <View style={styles.card}>
        {checks.map((key) => (
          <Pressable key={key} style={styles.checkRow} onPress={() => setForm((prev) => ({ ...prev, [key]: !prev[key] }))}>
            <View style={[styles.checkbox, form[key] && styles.checkboxOn]} />
            <Text style={styles.checkText}>{checkLabel[key]}</Text>
          </Pressable>
        ))}
        {form.other && (
          <TextInput
            placeholder="기타 점검 내용을 입력하세요"
            value={form.otherText}
            onChangeText={(text) => setForm((prev) => ({ ...prev, otherText: text }))}
            style={styles.input}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>상담 메모</Text>
        <TextInput
          multiline
          style={[styles.input, { minHeight: 96, textAlignVertical: 'top' }]}
          placeholder="점검/상담 내용을 남겨주세요"
          value={form.memo}
          onChangeText={(text) => setForm((prev) => ({ ...prev, memo: text }))}
        />
      </View>

      <View style={styles.chatCard}>
        <Text style={styles.sectionTitle}>상담 대화 느낌 (목업)</Text>
        {chatHint.map((line) => (
          <Text key={line} style={styles.chatText}>• {line}</Text>
        ))}
      </View>

      <Pressable style={styles.nextButton} onPress={onSaveAndMove}>
        <Text style={styles.nextButtonText}>다음 단계</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: -spacing.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    gap: spacing.sm,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  checkText: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  input: {
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chatCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.xs,
  },
  chatText: { color: colors.textSecondary, fontSize: 13 },
  nextButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  nextButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
