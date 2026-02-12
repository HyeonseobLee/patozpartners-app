import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NewRequestScreen from '../screens/NewRequestScreen';
import InProgressScreen from '../screens/InProgressScreen';
import StoreManagementScreen from '../screens/StoreManagementScreen';
import { colors } from '../styles/theme';

export type PartnerTabParamList = {
  NewRequest: undefined;
  InProgress: undefined;
  StoreManagement: undefined;
};

const Tab = createBottomTabNavigator<PartnerTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.royalBlue },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.royalBlue,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { borderTopColor: colors.royalBlueSoft },
      }}
    >
      <Tab.Screen name="NewRequest" component={NewRequestScreen} options={{ title: '신규 요청' }} />
      <Tab.Screen name="InProgress" component={InProgressScreen} options={{ title: '진행 중' }} />
      <Tab.Screen name="StoreManagement" component={StoreManagementScreen} options={{ title: '매장 관리' }} />
    </Tab.Navigator>
  );
};

export { MainNavigator };
export default MainNavigator;
