import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { ThemeProvider, useTheme } from './src/theme/theme';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import { syncInstalledModelsFromDevice } from './src/services/DownloadService';

function AppContent() {
  useEffect(() => {
    syncInstalledModelsFromDevice();
  }, []);
  const { PaperTheme, NavTheme, dark } = useTheme();
  return (
    <PaperProvider theme={PaperTheme}>
      <NavigationContainer theme={NavTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
        <DrawerNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
