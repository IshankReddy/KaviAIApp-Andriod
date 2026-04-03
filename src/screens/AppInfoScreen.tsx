import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Linking, Image,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';
import { themedBrandLogo } from '../constants/brandLogos';

const APP_VERSION = '1.0.2';

const EXTERNAL_LINKS = [
  { label: 'GitHub', url: 'https://github.com/KaviAIAgentic', icon: 'github' as const },
  { label: 'Hugging Face', url: 'https://huggingface.co/kaviwebdesigns', icon: 'robot-outline' as const },
  { label: 'YouTube', url: 'https://www.youtube.com/@kaviwebdesigns', icon: 'youtube' as const },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/company/kavi-ai/', icon: 'linkedin' as const },
  { label: 'Website', url: 'https://www.kaviagentic.com', icon: 'web' as const },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', screen: 'Privacy Policy', icon: 'shield-lock-outline' as const },
  { label: 'Terms of Service', screen: 'Terms', icon: 'file-document-outline' as const },
];

const LICENSES = [
  { name: 'llama.rn', license: 'MIT' },
  { name: 'llama.cpp', license: 'MIT' },
  { name: 'React Native', license: 'MIT (Facebook)' },
  { name: 'MobX', license: 'MIT' },
  { name: 'React Native Paper', license: 'MIT' },
  { name: 'Expo', license: 'MIT' },
];

export default function AppInfoScreen() {
  const navigation = useNavigation();
  const { Colors, dark } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      paddingTop: Platform.OS === 'ios' ? 60 : (RNStatusBar.currentHeight ?? 24) + 12,
      paddingBottom: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      zIndex: 10,
    },
    headerBtn: { 
      width: 40, 
      height: 40, 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: DesignTokens.borderRadius.sm,
    },
    headerTitle: { 
      flex: 1, 
      textAlign: 'center', 
      color: Colors.onSurface, 
      fontSize: 17, 
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    content: { 
      padding: DesignTokens.spacing.md, 
      paddingBottom: 60 
    },
    appBanner: { alignItems: 'center', paddingVertical: 40, marginBottom: 16 },
    appLogoWrap: { 
      width: 90, 
      height: 90, 
      marginBottom: 16,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    appLogo: { width: 64, height: 64 },
    appName: { 
      color: Colors.onSurface, 
      fontSize: 32, 
      fontWeight: '800', 
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    appTagline: { 
      color: Colors.primary, 
      fontSize: 14, 
      marginBottom: 16,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    versionBadge: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: DesignTokens.borderRadius.xl,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    versionText: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 13,
      fontWeight: '700',
    },
    developerCard: {
      flexDirection: 'row',
      gap: 14,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'flex-start',
    },
    developerText: { flex: 1 },
    developerLabel: { 
      color: Colors.onSurface, 
      fontSize: 12, 
      fontWeight: '800', 
      textTransform: 'uppercase', 
      letterSpacing: 1, 
      marginBottom: 6 
    },
    developerBody: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 14, 
      lineHeight: 20,
      fontWeight: '500',
    },
    privacyCard: {
      flexDirection: 'row',
      gap: 14,
      backgroundColor: Colors.primary + '08',
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1.5,
      borderColor: Colors.primary + '22',
      alignItems: 'flex-start',
    },
    privacyText: { flex: 1 },
    privacyTitle: { 
      color: Colors.primary, 
      fontSize: 16, 
      fontWeight: '700', 
      marginBottom: 6,
      letterSpacing: -0.2,
    },
    privacyBody: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 14, 
      lineHeight: 20,
      fontWeight: '500', 
    },
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 8,
      marginLeft: 4,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    linkText: { 
      flex: 1, 
      color: Colors.onSurface, 
      fontSize: 15,
      fontWeight: '600',
    },
    licenseTable: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: 24,
    },
    licenseRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    licenseBorder: { 
      borderBottomWidth: 1.5, 
      borderBottomColor: Colors.border 
    },
    licenseName: { 
      color: Colors.onSurface, 
      fontSize: 14,
      fontWeight: '600',
    },
    licenseLabel: { 
      color: Colors.metaText, 
      fontSize: 13,
      fontWeight: '700',
    },
    footer: { 
      color: Colors.metaText, 
      fontSize: 12, 
      textAlign: 'center', 
      lineHeight: 20, 
      marginTop: 12,
      fontWeight: '600',
      opacity: 0.7,
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MaterialCommunityIcons name="menu" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* App identity */}
        <View style={styles.appBanner}>
          <View style={styles.appLogoWrap}>
            <Image source={themedBrandLogo(dark)} style={styles.appLogo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>KaviAI</Text>
          <Text style={styles.appTagline}>On-device AI, entirely private</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* Developer info (PDR) */}
        <View style={styles.developerCard}>
          <MaterialCommunityIcons name="code-tags" size={20} color={Colors.primaryLight} />
          <View style={styles.developerText}>
            <Text style={styles.developerLabel}>Developer</Text>
            <Text style={styles.developerBody}>
              KaviAI is built with React Native, Expo, and llama.cpp. Open-source on-device AI.
            </Text>
          </View>
        </View>

        {/* Privacy notice */}
        <View style={styles.privacyCard}>
          <MaterialCommunityIcons name="shield-check" size={22} color={Colors.primaryLight} />
          <View style={styles.privacyText}>
            <Text style={styles.privacyTitle}>100% Private & Offline</Text>
            <Text style={styles.privacyBody}>
              All AI processing happens on your device. Your conversations, prompts, and data
              never leave your phone and are not stored on any server.
            </Text>
          </View>
        </View>

        {/* Social Links */}
        <Text style={styles.sectionLabel}>CONNECT</Text>
        {EXTERNAL_LINKS.map(link => (
          <TouchableOpacity
            key={link.url}
            style={styles.linkRow}
            onPress={() => Linking.openURL(link.url)}
          >
            <MaterialCommunityIcons name={link.icon} size={18} color={Colors.onSurfaceVariant} />
            <Text style={styles.linkText}>{link.label}</Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={Colors.metaText} />
          </TouchableOpacity>
        ))}

        {/* Legal */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        {LEGAL_LINKS.map(link => (
          <TouchableOpacity
            key={link.screen}
            style={styles.linkRow}
            onPress={() => (navigation as any).navigate(link.screen)}
          >
            <MaterialCommunityIcons name={link.icon} size={18} color={Colors.onSurfaceVariant} />
            <Text style={styles.linkText}>{link.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.metaText} />
          </TouchableOpacity>
        ))}

        {/* Tech stack */}
        <Text style={styles.sectionLabel}>POWERED BY</Text>
        <View style={styles.licenseTable}>
          {LICENSES.map((l, i) => (
            <View
              key={l.name}
              style={[styles.licenseRow, i < LICENSES.length - 1 && styles.licenseBorder]}
            >
              <Text style={styles.licenseName}>{l.name}</Text>
              <Text style={styles.licenseLabel}>{l.license}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Built with llama.cpp for on-device AI inference.{'\n'}
          &copy; KAVI.ai 2026. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}
