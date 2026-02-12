import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NewRequestScreen from '../screens/NewRequestScreen';
import RepairManageScreen from '../screens/RepairManageScreen';
import ReportScreen from '../screens/ReportScreen';
import { colors } from '../styles/theme';

export type PartnerTabParamList = {
  NewRequest: undefined;
  RepairManage: undefined;
  RepairReport: undefined;
};

const Tab = createBottomTabNavigator<PartnerTabParamList>();

const PartnerNavigator = () => {
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
      <Tab.Screen name="RepairManage" component={RepairManageScreen} options={{ title: '수리 관리' }} />
      <Tab.Screen name="RepairReport" component={ReportScreen} options={{ title: '수리 리포트' }} />
    </Tab.Navigator>
  );
};

export default PartnerNavigator;
