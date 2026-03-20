import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { LinearGradient } from 'expo-linear-gradient';

import ChatScreen      from '../screens/ChatScreen';
import ModelsScreen    from '../screens/ModelsScreen';
import PalsScreen      from '../screens/PalsScreen';
import BenchmarkScreen from '../screens/BenchmarkScreen';
import SettingsScreen  from '../screens/SettingsScreen';
import AppInfoScreen   from '../screens/AppInfoScreen';

const Drawer = createDrawerNavigator();
const LOGO = require('../../assets/logo.png');

const MENU_ITEMS = [
  { name: 'Chat',      icon: 'chat-outline',       iconActive: 'chat' },
  { name: 'Pals',      icon: 'star-outline',        iconActive: 'star' },
  { name: 'Models',    icon: 'view-grid-outline',   iconActive: 'view-grid' },
  { name: 'Benchmark', icon: 'timer-outline',       iconActive: 'timer' },
  { name: 'Settings',  icon: 'cog-outline',         iconActive: 'cog' },
  { name: 'App Info',  icon: 'information-outline', iconActive: 'information' },
] as const;

const CustomDrawerContent = observer(function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const { Colors } = useTheme();
  const activeIndex = state.index;
  
  const styles = useMemo(() => StyleSheet.create({
    drawer: { backgroundColor: Colors.background },
    drawerScroll: { flexGrow: 1, backgroundColor: Colors.background },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 6,
    },
    logoImg: { width: 36, height: 36 },
    brandName: {
      color: Colors.onSurface,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    tagline: {
      color: Colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '600',
      paddingHorizontal: 20,
      marginBottom: 20,
      opacity: 0.7,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginHorizontal: 20,
      marginBottom: 16,
      opacity: 0.6,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInfo: { flex: 1 },
    userEmail: {
      color: Colors.onSurface,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    userStatus: {
      color: Colors.onSurfaceVariant,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
      opacity: 0.7,
    },
    authRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    authBtn: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authBtnPrimary: {
      backgroundColor: Colors.primary,
    },
    authBtnOutline: {
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    authBtnTextPrimary: {
      color: Colors.onPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    authBtnTextOutline: {
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '700',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      height: 46,
      paddingHorizontal: 20,
      marginHorizontal: 10,
      borderRadius: 12,
      marginBottom: 2,
    },
    menuItemActive: {
      backgroundColor: Colors.primary + '14',
    },
    menuLabel: {
      color: Colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: '600',
    },
    menuLabelActive: {
      color: Colors.primary,
      fontWeight: '800',
    },
    bottomSpacer: { flex: 1, minHeight: 20 },
    copyright: {
      color: Colors.metaText,
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
      paddingBottom: 24,
      opacity: 0.5,
      letterSpacing: 0.3,
    },
  }), [Colors]);

  const openAuth = (mode?: 'signin' | 'signup') => {
    navigation.getParent?.()?.navigate?.('Auth', { mode });
  };

  const email = authStore.user?.email;
  const initials = email ? email[0].toUpperCase() : '?';

  const logoScale = useRef(new Animated.Value(1)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const handleBrandPress = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 0.8, useNativeDriver: true, speed: 50, bounciness: 4 }),
        Animated.timing(logoRotate, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1.15, useNativeDriver: true, speed: 12, bounciness: 14 }),
        Animated.timing(logoRotate, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start(() => {
      navigation.navigate('Chat' as never);
      navigation.closeDrawer();
    });
  }, [navigation, logoScale, logoRotate]);

  const rotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-12deg'],
  });

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScroll}
      style={styles.drawer}
    >
      {/* Brand — tap to go home */}
      <TouchableOpacity
        style={styles.brandRow}
        onPress={handleBrandPress}
        activeOpacity={1}
      >
        <Animated.Image
          source={LOGO}
          style={[styles.logoImg, { transform: [{ scale: logoScale }, { rotate: rotateInterpolate }] }]}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>KaviAI</Text>
      </TouchableOpacity>
      <Text style={styles.tagline}>Your AI, your device, your rules.</Text>

      <View style={styles.divider} />

      {/* User */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: '800' }}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {email ?? 'Not signed in'}
          </Text>
          <Text style={styles.userStatus}>
            {authStore.isSignedIn
              ? authStore.isEmailVerified ? 'Verified' : 'Email not verified'
              : 'Sign in to sync'}
          </Text>
        </View>
      </View>

      {/* Auth buttons */}
      {!authStore.isSignedIn ? (
        <View style={styles.authRow}>
          <TouchableOpacity
            style={[styles.authBtn, styles.authBtnOutline]}
            onPress={() => openAuth('signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.authBtnTextOutline}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authBtn, styles.authBtnPrimary]}
            onPress={() => openAuth('signin')}
            activeOpacity={0.8}
          >
            <Text style={styles.authBtnTextPrimary}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authRow}>
          {!authStore.isEmailVerified && (
            <TouchableOpacity
              style={[styles.authBtn, styles.authBtnOutline]}
              onPress={() => authStore.resendVerification(email ?? '')}
              activeOpacity={0.7}
            >
              <Text style={styles.authBtnTextOutline}>Verify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.authBtn, styles.authBtnPrimary]}
            onPress={() => authStore.signOut()}
            activeOpacity={0.8}
          >
            <Text style={styles.authBtnTextPrimary}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.divider} />

      {/* Menu */}
      {MENU_ITEMS.map((item, idx) => {
        const isActive = idx === activeIndex;
        return (
          <TouchableOpacity
            key={item.name}
            style={[styles.menuItem, isActive && styles.menuItemActive]}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={(isActive ? item.iconActive : item.icon) as any}
              size={22}
              color={isActive ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.name}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={styles.bottomSpacer} />
      <Text style={styles.copyright}>&copy; KAVI.ai 2026</Text>
    </DrawerContentScrollView>
  );
});

export default function DrawerNavigator() {
  const { Colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    drawerContainer: { backgroundColor: Colors.background, width: 285 },
  }), [Colors]);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawerContainer,
        overlayColor: 'rgba(15, 17, 21, 0.6)',
        drawerType: 'front',
        swipeEdgeWidth: 32,
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
