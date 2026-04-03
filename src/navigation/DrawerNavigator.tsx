import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Animated } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';


import ChatScreen        from '../screens/ChatScreen';
import ModelsScreen      from '../screens/ModelsScreen';
import PalsScreen        from '../screens/PalsScreen';
import BenchmarkScreen   from '../screens/BenchmarkScreen';
import SettingsScreen    from '../screens/SettingsScreen';
import AppInfoScreen     from '../screens/AppInfoScreen';
// KaviModelsScreen removed pre-App Store: Apple rejects "Coming Soon" screens
import PrivacyPolicyScreen  from '../screens/PrivacyPolicyScreen';
import TermsScreen          from '../screens/TermsScreen';
import { themedBrandLogo } from '../constants/brandLogos';

const Drawer = createDrawerNavigator();

const MENU_ITEMS = [
  { name: 'Chat',           label: 'Chat',           icon: 'chat-outline',              iconActive: 'chat' },
  { name: 'Prompt Lab',     label: 'Prompt Lab',     icon: 'flask-outline',             iconActive: 'flask' },
  { name: 'Models',         label: 'Models',         icon: 'view-grid-outline',         iconActive: 'view-grid' },
  { name: 'Evaluation',     label: 'Evaluation',     icon: 'chart-timeline-variant',    iconActive: 'chart-timeline-variant' },
  { name: 'Settings',       label: 'Settings',       icon: 'cog-outline',               iconActive: 'cog' },
  { name: 'App Info',       label: 'App Info',       icon: 'information-outline',        iconActive: 'information' },
] as const;

const CustomDrawerContent = observer(function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const { Colors, dark } = useTheme();
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
      paddingBottom: 2,
    },
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 20,
      marginBottom: 14,
      opacity: 0.55,
    },

    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginHorizontal: 20,
      marginVertical: 14,
      opacity: 0.5,
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
      marginBottom: 6,
    },
    authBtn: {
      flex: 1,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authBtnPrimary: { backgroundColor: Colors.primary },
    authBtnOutline: { borderWidth: 1.5, borderColor: Colors.border },
    authBtnTextPrimary: { color: Colors.onPrimary, fontSize: 13, fontWeight: '700' },
    authBtnTextOutline: { color: Colors.onSurfaceVariant, fontSize: 13, fontWeight: '700' },

    sectionLabel: {
      color: Colors.metaText,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      marginTop: 4,
      marginBottom: 6,
      opacity: 0.5,
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
      flex: 1,
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

  const handleBrandPress = useCallback(() => {
    navigation.navigate('Chat' as never);
    navigation.closeDrawer();
    Animated.sequence([
      Animated.timing(logoScale, { toValue: 0.85, duration: 60, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
  }, [navigation, logoScale]);

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScroll}
      style={styles.drawer}
    >
      {/* Brand — tap to go home */}
      <TouchableOpacity style={styles.brandRow} onPress={handleBrandPress} activeOpacity={0.8}>
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
          <Image source={themedBrandLogo(dark)} style={styles.logoImg} resizeMode="contain" />
        </Animated.View>
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

      {/* Auth */}
      {!authStore.isSignedIn ? (
        <View style={styles.authRow}>
          <TouchableOpacity style={[styles.authBtn, styles.authBtnPrimary, { flex: 1 }]} onPress={() => openAuth()} activeOpacity={0.8}>
            <Text style={styles.authBtnTextPrimary}>Get Started</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authRow}>
          {!authStore.isEmailVerified && (
            <TouchableOpacity style={[styles.authBtn, styles.authBtnOutline]} onPress={() => authStore.resendVerification(email ?? '')} activeOpacity={0.7}>
              <Text style={styles.authBtnTextOutline}>Verify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.authBtn, styles.authBtnPrimary]} onPress={() => authStore.signOut()} activeOpacity={0.8}>
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
            <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
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
      <Drawer.Screen name="Chat"           component={ChatScreen}       />
      <Drawer.Screen name="Prompt Lab"     component={PalsScreen}       />
      <Drawer.Screen name="Models"         component={ModelsScreen}     />
      <Drawer.Screen name="Evaluation"     component={BenchmarkScreen}  />
      <Drawer.Screen name="Settings"       component={SettingsScreen}   />
      <Drawer.Screen name="App Info"       component={AppInfoScreen}        />
      <Drawer.Screen name="Privacy Policy" component={PrivacyPolicyScreen} />
      <Drawer.Screen name="Terms"          component={TermsScreen}          />
    </Drawer.Navigator>
  );
}
