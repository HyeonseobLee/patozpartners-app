import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const onPressCreate = () => {
    Alert.alert('신규 요청', '신규 요청 작성 화면으로 이동합니다.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>신규 수리 접수</Text>
        <Pressable onPress={onPressCreate} style={styles.actionButton} hitSlop={8}>
          <Text style={styles.actionButtonText}>신규 요청 등록</Text>
        </Pressable>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    position: 'relative',
    zIndex: 10,
    elevation: 3,
  },
  title: {
    color: colors.royalBlue,
    fontSize: 20,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
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
