import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

type Store = {
  id: string;
  name: string;
  address: string;
  phone: string;
  x: string;
  y: string;
  canSell: boolean;
  canRepair: boolean;
};

const STORES: Store[] = [
  {
    id: 'store-gangnam',
    name: 'PATOZ 강남 플래그십',
    address: '서울 강남구 테헤란로 302',
    phone: '02-1234-5678',
    x: '28%',
    y: '44%',
    canSell: true,
    canRepair: true,
  },
  {
    id: 'store-hongdae',
    name: 'PATOZ 홍대 스토어',
    address: '서울 마포구 양화로 170',
    phone: '02-2222-3015',
    x: '50%',
    y: '58%',
    canSell: true,
    canRepair: false,
  },
  {
    id: 'store-jamsil',
    name: 'PATOZ 잠실 리페어 센터',
    address: '서울 송파구 올림픽로 240',
    phone: '02-9876-1200',
    x: '72%',
    y: '34%',
    canSell: false,
    canRepair: true,
  },
];

const StoreManagementScreen = () => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selectedStore ? 1 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [selectedStore, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [180, 0],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>매장 찾기</Text>
      <Text style={styles.subtitle}>원하는 매장을 선택해 정보를 확인하세요.</Text>

      <View style={styles.mapArea}>
        <Text style={styles.mapLabel}>PATOZ STORE MAP</Text>
        {STORES.map((store) => {
          const isSelected = selectedStore?.id === store.id;

          return (
            <Pressable
              key={store.id}
              accessibilityRole="button"
              onPress={() => setSelectedStore(store)}
              style={[styles.marker, { left: store.x, top: store.y }, isSelected ? styles.markerSelected : null]}
            >
              <Text style={[styles.markerText, isSelected ? styles.markerTextSelected : null]}>P</Text>
            </Pressable>
          );
        })}
      </View>

      {!selectedStore ? (
        <View style={styles.guideContainer}>
          <Text style={styles.guideText}>지도에서 매장을 선택하고 매장정보를 확인해보세요</Text>
        </View>
      ) : null}

      {selectedStore ? (
        <Animated.View style={[styles.infoCard, { transform: [{ translateY }] }]}>
          <Text style={styles.storeName}>{selectedStore?.name ?? '선택된 매장이 없습니다.'}</Text>
          <Text style={styles.storeMeta}>{selectedStore?.address ?? '-'}</Text>
          <Text style={styles.storeMeta}>{selectedStore?.phone ?? '-'}</Text>

          <View style={styles.tagRow}>
            {selectedStore?.canSell ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>판매점</Text>
              </View>
            ) : null}
            {selectedStore?.canRepair ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>수리점</Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnightNavy,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? spacing.xl + spacing.lg : spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.royalBlueSoft,
    fontSize: 14,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  mapArea: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: '#242D40',
    borderWidth: 1,
    borderColor: colors.royalBlue,
    overflow: 'hidden',
  },
  mapLabel: {
    color: colors.royalBlueSoft,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  marker: {
    position: 'absolute',
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.royalBlue,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerSelected: {
    backgroundColor: colors.white,
    borderColor: colors.royalBlue,
  },
  markerText: {
    color: colors.white,
    fontWeight: '800',
  },
  markerTextSelected: {
    color: colors.royalBlue,
  },
  guideContainer: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(26,33,48,0.86)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.royalBlue,
  },
  guideText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderColor: colors.royalBlue,
    borderWidth: 1,
    shadowColor: colors.cardShadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 8,
  },
  storeName: {
    color: colors.midnightNavy,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xxs,
  },
  storeMeta: {
    color: colors.midnightNavy,
    opacity: 0.8,
    fontSize: 13,
    marginBottom: spacing.xxs,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.royalBlueSoft,
    borderColor: colors.royalBlue,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  tagText: {
    color: colors.royalBlueDark,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default StoreManagementScreen;
