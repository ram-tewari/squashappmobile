import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CourtScreen from '../screens/CourtScreen';
import PauseScreen from '../screens/PauseScreen';

// Type-safe route parameters
export type RootStackParamList = {
  Home: undefined;
  Court: {
    shots: number;
    timeBetweenShots: number;
    sets: number;
    timeBetweenSets: number;
  };
  Pause: undefined;
};

// Create the stack
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Court" component={CourtScreen} />
      <Stack.Screen name="Pause" component={PauseScreen} />
    </Stack.Navigator>
  );
}
