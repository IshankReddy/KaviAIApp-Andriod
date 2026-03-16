import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Linking, Image,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

const APP_VERSION = '1.0.0';
const LOGO = require('../../assets/logo.png');

const LINKS = [
  { label: 'GitHub Repository', url: 'https://github.com', icon: 'github' as const },
  { label: 'Hugging Face Hub', url: 'https://huggingface.co', icon: 'robot-outline' as const },
  { label: 'Privacy Policy', url: 'https://example.com/privacy', icon: 'shield-lock-outline' as const },
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
  const { Colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingTop: Platform.OS === 'ios' ? 50 : 12,
      paddingBottom: 10,
      paddingHorizontal: 8,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 16, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 60 },
    appBanner: { alignItems: 'center', paddingVertical: 28, marginBottom: 16 },
    appLogoWrap: { width: 80, height: 80, marginBottom: 10 },
    appLogo: { width: 80, height: 80 },
    appName: { color: Colors.onSurface, fontSize: 26, fontWeight: '700', marginBottom: 4 },
    appTagline: { color: Colors.metaText, fontSize: 14, marginBottom: 12 },
    versionBadge: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    versionText: { color: Colors.onSurfaceVariant, fontSize: 12 },
    developerCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'flex-start',
    },
    developerText: { flex: 1 },
    developerLabel: { color: Colors.onSurface, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    developerBody: { color: Colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 },
    privacyCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.primary + '44',
      alignItems: 'flex-start',
    },
    privacyText: { flex: 1 },
    privacyTitle: { color: Colors.onSurface, fontSize: 14, fontWeight: '600', marginBottom: 4 },
    privacyBody: { color: Colors.onSurfaceVariant, fontSize: 13, lineHeight: 18 },
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 4,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    linkText: { flex: 1, color: Colors.onSurface, fontSize: 14 },
    licenseTable: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 20,
    },
    licenseRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
    licenseBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    licenseName: { color: Colors.onSurface, fontSize: 13 },
    licenseLabel: { color: Colors.metaText, fontSize: 13 },
    footer: { color: Colors.metaText, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  }), [Colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MaterialCommunityIcons name="menu" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* App identity */}
        <View style={styles.appBanner}>
          <View style={styles.appLogoWrap}>
            <Image source={LOGO} style={styles.appLogo} resizeMode="contain" />
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

        {/* Links */}
        <Text style={styles.sectionLabel}>LINKS</Text>
        {LINKS.map(link => (
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
          Built with ❤️ using llama.cpp for on-device AI inference.{'\n'}
          KaviAI is open-source software.
        </Text>
      </ScrollView>
    </View>
  );
}
