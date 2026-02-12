import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueueScreen } from '../screens/partners/QueueScreen';
import { InspectionScreen } from '../screens/partners/InspectionScreen';
import { InspectionDetailScreen } from '../screens/partners/InspectionDetailScreen';
import { RepairHomeScreen } from '../screens/partners/RepairHomeScreen';
import { RepairManageScreen } from '../screens/partners/RepairManageScreen';
import { ReportScreen } from '../screens/partners/ReportScreen';
import { InspectionStackParamList, QueueStackParamList, RepairStackParamList, ReportStackParamList } from './partnersTypes';
import { RepairCasesProvider } from '../context/RepairCasesContext';
import { colors } from '../styles/theme';

const Tab = createBottomTabNavigator();
const QueueStack = createNativeStackNavigator<QueueStackParamList>();
const InspectionStack = createNativeStackNavigator<InspectionStackParamList>();
const RepairStack = createNativeStackNavigator<RepairStackParamList>();
const ReportStack = createNativeStackNavigator<ReportStackParamList>();

const QueueStackScreen = () => (
  <QueueStack.Navigator>
    <QueueStack.Screen name="QueueHome" component={QueueScreen} options={{ title: '신규 요청' }} />
    <QueueStack.Screen name="RepairManageDetail" component={RepairManageScreen as never} options={{ title: '수리 관리' }} />
  </QueueStack.Navigator>
);

const InspectionStackScreen = () => (
  <InspectionStack.Navigator>
    <InspectionStack.Screen name="InspectionHome" component={InspectionScreen} options={{ title: '점검' }} />
    <InspectionStack.Screen name="InspectionDetail" component={InspectionDetailScreen} options={{ title: '점검 체크' }} />
    <InspectionStack.Screen name="RepairManageDetail" component={RepairManageScreen as never} options={{ title: '수리 관리' }} />
  </InspectionStack.Navigator>
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
        <Tab.Screen name="NewRequest" component={QueueStackScreen} options={{ title: '신규 요청' }} />
        <Tab.Screen name="Inspection" component={InspectionStackScreen} options={{ title: '점검' }} />
        <Tab.Screen name="RepairManage" component={RepairStackScreen} options={{ title: '수리 관리' }} />
        <Tab.Screen name="RepairReport" component={ReportStackScreen} options={{ title: '수리 리포트' }} />
      </Tab.Navigator>
    </RepairCasesProvider>
  );
};

export default PartnerNavigator;
