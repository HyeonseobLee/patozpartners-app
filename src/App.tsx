import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import PartnerNavigator from './navigation/PartnerNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <PartnerNavigator />
    </NavigationContainer>
  );
};

export default App;
