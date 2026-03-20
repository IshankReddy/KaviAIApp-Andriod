import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './DrawerNavigator';
import LoginScreen from '../screens/LoginScreen';

export type RootStackParamList = {
  Main: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={DrawerNavigator} />
      <Stack.Screen
        name="Auth"
        component={LoginScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

