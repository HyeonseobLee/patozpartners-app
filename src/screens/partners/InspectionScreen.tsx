import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRepairCases } from '../../context/RepairCasesContext';
import { InspectionStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';

type Props = NativeStackScreenProps<InspectionStackParamList, 'InspectionHome'>;

export const InspectionScreen = ({ navigation }: Props) => {
  const { cases } = useRepairCases();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>점검/상담</Text>
      {cases.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => navigation.push('InspectionDetail', { caseId: item.id })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.model}>{item.deviceModel}</Text>
            <Text style={styles.meta}>{item.customerName ?? '고객 미등록'} · {item.serialNumber}</Text>
            <Text style={styles.meta}>접수번호 {item.intakeNumber}</Text>
          </View>
          <StatusBadge status={item.status} />
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.borderSoft,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  model: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { marginTop: 2, fontSize: 12, color: colors.textSecondary },
});
