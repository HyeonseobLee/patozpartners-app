import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

type RepairRequest = {
  id: string;
  customerName: string;
  device: string;
  receivedAt: string;
};

const repairRequests: RepairRequest[] = [
  { id: '1', customerName: '김현우', device: 'iPhone 14 Pro', receivedAt: '09:12' },
  { id: '2', customerName: '박서연', device: 'Galaxy S23', receivedAt: '10:04' },
  { id: '3', customerName: '이민재', device: 'iPad Air 5', receivedAt: '11:28' },
];

const NewRequestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>신규 수리 접수</Text>
      <FlatList
        data={repairRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.device}>{item.device}</Text>
            <Text style={styles.meta}>접수 시간: {item.receivedAt}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    color: colors.royalBlue,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.royalBlueSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  customerName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  device: {
    color: colors.royalBlue,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});

export default NewRequestScreen;
