import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, Linking, LogBox, StyleSheet } from 'react-native';

LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered']);
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from './src/theme/theme';
import { syncInstalledModelsFromDevice } from './src/services/DownloadService';
import { authStore } from './src/stores/AuthStore';
import { secretsStore } from './src/stores/SecretsStore';
import { observer } from 'mobx-react-lite';
import RootNavigator from './src/navigation/RootNavigator';
import SplashOverlay from './src/components/SplashOverlay';

const AppContent = observer(function AppContent() {
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      // Retry a few times on cold start; FileSystem can be unavailable before the native bridge is fully ready.
      const delays = [250, 500, 800, 1200, 1800, 2500];
      for (const delay of delays) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          t = setTimeout(() => resolve(), delay);
        });
        if (cancelled) return;
        const ok = await syncInstalledModelsFromDevice();
        if (ok) return;
      }
    };

    run();
    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    authStore.hydrate();
    secretsStore.hydrate();
  }, []);

  useEffect(() => {
    const handle = (url: string) => {
      if (url.includes('/auth/callback')) {
        void authStore.handleAuthCallbackUrl(url);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handle(url);
    });

    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const onStateChange = (state: AppStateStatus) => {
      if (state === 'active') void authStore.refreshSessionIfNeeded();
    };
    const sub = AppState.addEventListener('change', onStateChange);
    return () => sub.remove();
  }, []);

  const { PaperTheme, NavTheme, dark } = useTheme();
  return (
    <PaperProvider theme={PaperTheme}>
      <NavigationContainer theme={NavTheme}>
        <StatusBar style={dark ? 'light' : 'dark'} backgroundColor="transparent" translucent />
        <RootNavigator />
        {!splashDone && <SplashOverlay onFinish={() => setSplashDone(true)} />}
      </NavigationContainer>
    </PaperProvider>
  );
});

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
