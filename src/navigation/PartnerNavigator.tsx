import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RepairHomeScreen } from '../screens/partners/RepairHomeScreen';
import { RepairManageScreen } from '../screens/partners/RepairManageScreen';
import { ReportScreen } from '../screens/partners/ReportScreen';
import NewRequestScreen from '../screens/NewRequestScreen';
import StoreManagementScreen from '../screens/StoreManagementScreen';
import { RepairStackParamList, ReportStackParamList } from './partnersTypes';
import { RepairCasesProvider } from '../context/RepairCasesContext';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();
const RepairStack = createNativeStackNavigator<RepairStackParamList>();
const ReportStack = createNativeStackNavigator<ReportStackParamList>();

const RepairStackScreen = () => (
  <RepairStack.Navigator>
    <RepairStack.Screen name="RepairHome" component={RepairHomeScreen} options={{ title: '수리 관리' }} />
    <RepairStack.Screen name="RepairManageDetail" component={RepairManageScreen} options={{ title: '수리 상세' }} />
  </RepairStack.Navigator>
);

const ReportStackScreen = () => (
  <ReportStack.Navigator>
    <ReportStack.Screen name="ReportHome" component={ReportScreen} options={{ title: '수리 리포트' }} />
  </ReportStack.Navigator>
);

const PartnerNavigator = () => {
  return (
    <RepairCasesProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.royalBlue,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { borderTopColor: colors.royalBlueSoft },
        }}
      >
        <Tab.Screen name="NewRequest" component={NewRequestScreen} options={{ title: '신규 요청' }} />
        <Tab.Screen name="RepairManage" component={RepairStackScreen} options={{ title: '수리 관리' }} />
        <Tab.Screen name="RepairReport" component={ReportStackScreen} options={{ title: '수리 리포트' }} />
        <Tab.Screen name="StoreFinder" component={StoreManagementScreen} options={{ title: '매장 찾기' }} />
      </Tab.Navigator>
    </RepairCasesProvider>
  );
};

export default PartnerNavigator;
