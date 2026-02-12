import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { RepairHomeScreen } from '../screens/partners/RepairHomeScreen';
import { RepairDetailScreen } from '../screens/partners/RepairDetailScreen';
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
    <NewRequestStack.Screen name="RepairManageDetail" component={RepairDetailScreen} options={{ title: '수리 상세' }} />
  </NewRequestStack.Navigator>
);

const RepairStackScreen = () => (
  <RepairStack.Navigator>
    <RepairStack.Screen name="RepairHome" component={RepairHomeScreen} options={{ title: '수리 관리' }} />
    <RepairStack.Screen name="RepairManageDetail" component={RepairDetailScreen} options={{ title: '수리 상세' }} />
  </RepairStack.Navigator>
);

const ReportStackScreen = () => (
  <ReportStack.Navigator>
    <ReportStack.Screen name="ReportHome" component={ReportScreen} options={{ title: '수리 리포트' }} />
  </ReportStack.Navigator>
);

const iconCommon = { strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M3 10.8L12 3l9 7.8" stroke={color} fill="none" {...iconCommon} />
    <Path d="M6 10.2V20h12v-9.8" stroke={color} fill="none" {...iconCommon} />
  </Svg>
);

const ListIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M7 6h12M7 12h12M7 18h12" stroke={color} fill="none" {...iconCommon} />
    <Path d="M4 6h.01M4 12h.01M4 18h.01" stroke={color} fill="none" {...iconCommon} />
  </Svg>
);

const BarChartIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path d="M4 20h16" stroke={color} fill="none" {...iconCommon} />
    <Path d="M7 20v-7M12 20V8M17 20v-11" stroke={color} fill="none" {...iconCommon} />
  </Svg>
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
          tabBarStyle: { borderTopColor: colors.royalBlueSoft, height: 70, paddingTop: 8, paddingBottom: 8 },
          tabBarIconStyle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
        }}
      >
        <Tab.Screen name="NewRequest" component={NewRequestStackScreen} options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
        <Tab.Screen name="RepairManage" component={RepairStackScreen} options={{ tabBarIcon: ({ color }) => <ListIcon color={color} /> }} />
        <Tab.Screen name="RepairReport" component={ReportStackScreen} options={{ tabBarIcon: ({ color }) => <BarChartIcon color={color} /> }} />
      </Tab.Navigator>
    </RepairCasesProvider>
  );
};

export default PartnerNavigator;
