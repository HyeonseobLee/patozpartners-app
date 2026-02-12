import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STATUS_LABEL, useRepairCases } from '../../context/RepairCasesContext';
import { NewRequestStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';

type Props = NativeStackScreenProps<NewRequestStackParamList, 'NewRequestHome'>;

export const QueueScreen = ({ navigation }: Props) => {
  const { cases } = useRepairCases();

  const sortedCases = useMemo(
    () => [...cases].filter((item) => item.status === 'NEW_REQUEST').sort((a, b) => +new Date(b.intakeAt) - +new Date(a.intakeAt)),
    [cases],
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedCases.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => navigation.push('RepairManageDetail', { caseId: item.id })}>
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbText}>IMG</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.deviceModel}</Text>
              <Text style={styles.meta}>상태: {STATUS_LABEL[item.status]}</Text>
              <Text style={styles.meta}>고객: {item.customerName ?? '미입력'}</Text>
              <Text style={styles.meta}>접수번호: {item.intakeNumber}</Text>
              <Text style={styles.meta}>접수시각: {new Date(item.intakeAt).toLocaleString()}</Text>
            </View>
          </Pressable>
        ))}
        {sortedCases.length === 0 && <Text style={styles.emptyText}>신규 요청 상태의 기기가 없습니다.</Text>}
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
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.md },
});
