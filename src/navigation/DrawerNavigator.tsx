import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';

import ChatScreen      from '../screens/ChatScreen';
import ModelsScreen    from '../screens/ModelsScreen';
import PalsScreen      from '../screens/PalsScreen';
import BenchmarkScreen from '../screens/BenchmarkScreen';
import SettingsScreen  from '../screens/SettingsScreen';
import AppInfoScreen   from '../screens/AppInfoScreen';

const Drawer = createDrawerNavigator();
const LOGO = require('../../assets/logo.png');

const MENU_ITEMS = [
  { name: 'Chat',      icon: 'chat-outline'       },
  { name: 'Pals',      icon: 'star-outline'        },
  { name: 'Models',    icon: 'view-grid-outline'   },
  { name: 'Benchmark', icon: 'timer-outline'       },
  { name: 'Settings',  icon: 'cog-outline'         },
  { name: 'App Info',  icon: 'information-outline' },
] as const;

const CustomDrawerContent = observer(function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const { Colors } = useTheme();
  const activeIndex = state.index;
  const styles = useMemo(() => StyleSheet.create({
    drawer: { backgroundColor: Colors.surface },
    drawerScroll: { flex: 1, backgroundColor: Colors.surface },
    drawerHeader: {
      paddingHorizontal: 22,
      paddingTop: 60,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      marginBottom: 10,
    },
    drawerLogo: { width: 48, height: 48, marginBottom: 10, borderRadius: 10 },
    drawerAppName: { color: Colors.onSurface, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
    drawerTagline: { color: Colors.metaText, fontSize: 12, marginTop: 2 },
    accountCard: {
      marginHorizontal: 10,
      marginBottom: 10,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 12,
    },
    accountTitle: { color: Colors.onSurface, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
    accountEmail: { color: Colors.onSurfaceVariant, marginTop: 6, fontSize: 13 },
    accountRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    accountBtn: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    accountBtnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    accountBtnSecondary: { backgroundColor: Colors.surface, borderColor: Colors.border },
    accountBtnTextPrimary: { color: Colors.onPrimary, fontSize: 13, fontWeight: '700' },
    accountBtnTextSecondary: { color: Colors.onSurface, fontSize: 13, fontWeight: '700' },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginHorizontal: 10,
      borderRadius: 12,
      marginBottom: 2,
    },
    menuItemActive: { backgroundColor: Colors.primary },
    menuLabel: { color: Colors.onSurfaceVariant, fontSize: 16, fontWeight: '500' },
    menuLabelActive: { color: Colors.onPrimary, fontWeight: '600' },
  }), [Colors]);

  const openAuth = (mode?: 'signin' | 'signup') => {
    // Drawer is nested under RootStack; navigate via parent navigator.
    navigation.getParent?.()?.navigate?.('Auth', { mode });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScroll}
      style={styles.drawer}
    >
      <View style={styles.drawerHeader}>
        <Image source={LOGO} style={styles.drawerLogo} resizeMode="contain" />
        <Text style={styles.drawerAppName}>KaviAI</Text>
        <Text style={styles.drawerTagline}>On-device AI</Text>
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.accountTitle}>Account</Text>
        <Text style={styles.accountEmail}>
          {authStore.user?.email ?? 'Not signed in'}
          {authStore.isSignedIn ? (authStore.isEmailVerified ? ' · Verified' : ' · Not verified') : ''}
        </Text>
        {!authStore.isSignedIn ? (
          <View style={styles.accountRow}>
            <TouchableOpacity
              style={[styles.accountBtn, styles.accountBtnSecondary]}
              onPress={() => openAuth('signup')}
            >
              <Text style={styles.accountBtnTextSecondary}>Sign up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accountBtn, styles.accountBtnPrimary]}
              onPress={() => openAuth('signin')}
            >
              <Text style={styles.accountBtnTextPrimary}>Sign in</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountRow}>
            {!authStore.isEmailVerified ? (
              <TouchableOpacity
                style={[styles.accountBtn, styles.accountBtnSecondary]}
                onPress={() => authStore.resendVerification(authStore.user?.email ?? '')}
              >
                <Text style={styles.accountBtnTextSecondary}>Verify email</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.accountBtn, styles.accountBtnPrimary]}
              onPress={() => authStore.signOut()}
            >
              <Text style={styles.accountBtnTextPrimary}>Sign out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {MENU_ITEMS.map((item, idx) => {
        const isActive = idx === activeIndex;
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.menuItem, isActive && styles.menuItemActive]}
            onPress={() => navigation.navigate(item.name)}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={isActive ? Colors.onPrimary : Colors.onSurfaceVariant}
            />
            <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
});

export default function DrawerNavigator() {
  const { Colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    drawerContainer: { backgroundColor: Colors.surface, width: 280 },
  }), [Colors]);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawerContainer,
        overlayColor: 'rgba(0,0,0,0.6)',
        drawerType: 'front',
        // Only open drawer when swipe starts at the very edge (avoids opening when dragging parameter slider thumbs)
        swipeEdgeWidth: 24,
      }}
    >
      <Drawer.Screen name="Chat"      component={ChatScreen}      />
      <Drawer.Screen name="Pals"      component={PalsScreen}      />
      <Drawer.Screen name="Models"    component={ModelsScreen}    />
      <Drawer.Screen name="Benchmark" component={BenchmarkScreen} />
      <Drawer.Screen name="Settings"  component={SettingsScreen}  />
      <Drawer.Screen name="App Info"  component={AppInfoScreen}   />
    </Drawer.Navigator>
  );
}
