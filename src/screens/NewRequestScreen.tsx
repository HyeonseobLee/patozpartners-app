import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../styles/theme';

const NewRequestScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>신규 요청</Text>
        <Text style={styles.description}>새로 접수된 수리 요청을 확인하고 배정할 수 있습니다.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.royalBlueSoft,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  title: {
    color: colors.royalBlue,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default NewRequestScreen;
