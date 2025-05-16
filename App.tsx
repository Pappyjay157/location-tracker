import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MapScreen from './src/MapScreen';
import WorkoutComplete from './src/WorkoutComplete';
import { RootStackParamList } from './src/types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Workout">
        <RootStack.Screen name="Workout" component={MapScreen} />
        <RootStack.Screen name="WorkoutComplete" component={WorkoutComplete} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
