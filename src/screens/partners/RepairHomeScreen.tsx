import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRepairCases } from '../../context/RepairCasesContext';
import { RepairStackParamList } from '../../navigation/partnersTypes';
import { colors, radius, spacing } from '../../styles/theme';
import { StatusBadge } from '../../components/partners/StatusBadge';

type Props = NativeStackScreenProps<RepairStackParamList, 'RepairHome'>;

export const RepairHomeScreen = ({ navigation }: Props) => {
  const { cases } = useRepairCases();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>수리 관리</Text>
      {cases.map((item) => (
        <Pressable key={item.id} style={styles.card} onPress={() => navigation.push('RepairManageDetail', { caseId: item.id })}>
          <View style={{ flex: 1 }}>
            <Text style={styles.model}>{item.deviceModel}</Text>
            <Text style={styles.meta}>{item.intakeNumber}</Text>
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
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  model: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { marginTop: 3, color: colors.textSecondary, fontSize: 12 },
});
