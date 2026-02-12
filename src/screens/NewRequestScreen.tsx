import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { STATUS_LABEL, useRepairCases } from '../context/RepairCasesContext';
import { colors, radius, spacing } from '../styles/theme';

const NewRequestScreen = () => {
  const navigation = useNavigation();
  const { cases, setStatus } = useRepairCases();

  const newRequests = useMemo(() => cases.filter((item) => STATUS_LABEL[item.status] === '신규 접수'), [cases]);

  const handleSendEstimate = (id: string) => {
    setStatus(id, 'INSPECTING');
    navigation.navigate('RepairManage' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>P</Text>
        </View>
        <View>
          <Text style={styles.logoText}>PATOZ Partners</Text>
          <Text style={styles.title}>신규 수리 요청</Text>
        </View>
      </View>

      <FlatList
        data={newRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={newRequests.length ? styles.listContent : styles.emptyContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🛠️</Text>
            </View>
            <Text style={styles.emptyText}>현재 들어온 신규 요청이 없습니다</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.thumbnail}>
                <Text style={styles.thumbnailLabel}>IMG</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.deviceTitle}>{item.deviceModel}</Text>
                <Text style={styles.meta}>시리얼 넘버: {item.serialNumber}</Text>
                <Text style={styles.meta}>AI 진단: {item.aiDiagnosis ?? '진단 데이터 수집 중'}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSendEstimate(item.id)}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>견적 보내기</Text>
            </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  logoText: {
    color: colors.royalBlue,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    color: colors.royalBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  deviceTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.royalBlue,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-end',
    zIndex: 999,
    elevation: 8,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NewRequestScreen;
