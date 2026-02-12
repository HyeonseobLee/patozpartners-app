import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RepairHomeScreen } from '../screens/partners/RepairHomeScreen';
import { RepairManageScreen } from '../screens/partners/RepairManageScreen';
import { QueueScreen } from '../screens/partners/QueueScreen';
import { ReportScreen } from '../screens/partners/ReportScreen';
import { NewRequestStackParamList, RepairStackParamList, ReportStackParamList } from './partnersTypes';
import { RepairCasesProvider } from '../context/RepairCasesContext';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();
const NewRequestStack = createNativeStackNavigator<NewRequestStackParamList>();
const RepairStack = createNativeStackNavigator<RepairStackParamList>();
const ReportStack = createNativeStackNavigator<ReportStackParamList>();

const NewRequestStackScreen = () => (
  <NewRequestStack.Navigator>
    <NewRequestStack.Screen name="NewRequestHome" component={QueueScreen} options={{ title: '신규 요청' }} />
    <NewRequestStack.Screen name="RepairManageDetail" component={RepairManageScreen} options={{ title: '수리 상세' }} />
  </NewRequestStack.Navigator>
);

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

const getTabIcon = (icon: string, color: string) => (
  <Text style={{ fontSize: 19, color }} accessibilityElementsHidden>
    {icon}
  </Text>
);

const PartnerNavigator = () => {
  return (
    <RepairCasesProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.royalBlue,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { borderTopColor: colors.royalBlueSoft },
        }}
      >
        <Tab.Screen name="NewRequest" component={NewRequestStackScreen} options={{ tabBarIcon: ({ color }) => getTabIcon('🆕', color) }} />
        <Tab.Screen name="RepairManage" component={RepairStackScreen} options={{ tabBarIcon: ({ color }) => getTabIcon('🛠️', color) }} />
        <Tab.Screen name="RepairReport" component={ReportStackScreen} options={{ tabBarIcon: ({ color }) => getTabIcon('📊', color) }} />
      </Tab.Navigator>
    </RepairCasesProvider>
  );
};

export default PartnerNavigator;
