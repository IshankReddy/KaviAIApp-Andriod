import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { Colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
      paddingTop: Platform.OS === 'ios' ? 60 : 16, paddingBottom: 14, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: DesignTokens.borderRadius.sm },
    headerTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    content: { padding: 20, paddingBottom: 60 },
    date: { color: Colors.metaText, fontSize: 13, fontWeight: '600', marginBottom: 20 },
    highlight: {
      backgroundColor: Colors.primary + '10', borderLeftWidth: 3, borderLeftColor: Colors.primary,
      padding: 16, borderRadius: 8, marginBottom: 24,
    },
    highlightText: { color: Colors.primary, fontSize: 14, fontWeight: '700', lineHeight: 20 },
    h2: { color: Colors.onSurface, fontSize: 17, fontWeight: '800', marginTop: 28, marginBottom: 10, letterSpacing: -0.2 },
    p: { color: Colors.onSurfaceVariant, fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 14 },
    bold: { fontWeight: '700', color: Colors.onSurface },
    tableWrap: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 16 },
    tableHeader: { flexDirection: 'row', backgroundColor: Colors.surfaceVariant, paddingVertical: 10, paddingHorizontal: 14 },
    tableHeaderText: { flex: 1, color: Colors.metaText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: Colors.border },
    tableCell: { flex: 1, color: Colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' },
    bullet: { color: Colors.onSurfaceVariant, fontSize: 14, lineHeight: 22, fontWeight: '500', marginBottom: 8, paddingLeft: 8 },
    footer: { color: Colors.metaText, fontSize: 12, textAlign: 'center', marginTop: 32, opacity: 0.6 },
  }), [Colors]);

  const TABLE_DATA = [
    ['Email address', 'Authentication', 'Supabase (cloud)'],
    ['Conversations', 'Chat history', 'On-device only'],
    ['Model files', 'AI inference', 'On-device only'],
    ['App settings', 'Preferences', 'On-device only'],
    ['API keys', 'Cloud AI (optional)', 'Device keychain'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => (navigation as any).navigate('App Info')}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>Effective: March 10, 2026 · Updated: March 21, 2026</Text>

        <Text style={styles.p}>
          KaviAI ("we", "our", "the app") is an on-device AI chat application. Your privacy is our highest priority.
        </Text>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            All AI processing happens on your device. Your conversations and prompts never leave your phone.
          </Text>
        </View>

        <Text style={styles.h2}>1. On-Device Processing</Text>
        <Text style={styles.p}>
          All AI model inference runs entirely on your device using llama.cpp. Your conversations, prompts, and AI-generated responses are processed locally and are{' '}
          <Text style={styles.bold}>never transmitted to our servers</Text>. We have no access to your chat history.
        </Text>

        <Text style={styles.h2}>2. Data We Collect</Text>
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Data</Text>
            <Text style={styles.tableHeaderText}>Purpose</Text>
            <Text style={styles.tableHeaderText}>Storage</Text>
          </View>
          {TABLE_DATA.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tableCell}>{row[0]}</Text>
              <Text style={styles.tableCell}>{row[1]}</Text>
              <Text style={styles.tableCell}>{row[2]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>3. Data We Do NOT Collect</Text>
        <Text style={styles.bullet}>• We do <Text style={styles.bold}>not</Text> collect, store, or transmit any chat content.</Text>
        <Text style={styles.bullet}>• We do <Text style={styles.bold}>not</Text> use analytics SDKs or advertising trackers.</Text>
        <Text style={styles.bullet}>• We do <Text style={styles.bold}>not</Text> sell or share your data with third parties.</Text>
        <Text style={styles.bullet}>• We do <Text style={styles.bold}>not</Text> collect device identifiers for tracking.</Text>

        <Text style={styles.h2}>4. Third-Party API Keys</Text>
        <Text style={styles.p}>
          You may optionally enter API keys for OpenAI, Anthropic, or Google Gemini. These keys are stored securely using your device's secure keychain. When you use a cloud model, messages are sent directly from your device to the provider's API. We never see or store these requests.
        </Text>

        <Text style={styles.h2}>5. Third-Party Services</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Supabase</Text> — Email/password authentication only.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Hugging Face</Text> — Browse and download open-source AI models.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>OpenAI / Anthropic / Google</Text> — Only if you provide your own API key.</Text>

        <Text style={styles.h2}>6. Data Storage & Deletion</Text>
        <Text style={styles.p}>
          All app data is stored locally on your device. Deleting the app removes all local data permanently. You can delete your account at any time from{' '}
          <Text style={styles.bold}>Settings → Delete Account</Text>. This permanently removes your account, profile, and all associated data from our servers.
        </Text>

        <Text style={styles.h2}>7. Children's Privacy</Text>
        <Text style={styles.p}>
          KaviAI is not directed at children under 13. We do not knowingly collect personal information from children.
        </Text>

        <Text style={styles.h2}>8. Your Rights</Text>
        <Text style={styles.p}>
          You may have the right to access, correct, delete, or port your personal data. Since we only store your email for authentication, contact us to exercise these rights. All other data is on your device and under your control.
        </Text>

        <Text style={styles.h2}>9. Security</Text>
        <Text style={styles.p}>
          We use industry-standard security measures including encrypted connections (HTTPS/TLS), secure authentication, and device-level secure storage for sensitive data like API keys.
        </Text>

        <Text style={styles.h2}>10. Changes</Text>
        <Text style={styles.p}>
          We may update this policy from time to time. Material changes will be communicated through the app. Continued use constitutes acceptance.
        </Text>

        <Text style={styles.h2}>11. Contact</Text>
        <Text style={styles.p}>
          Questions? Contact us at: <Text style={styles.bold}>kaviai.app@gmail.com</Text>
        </Text>

        <Text style={styles.footer}>© KAVI.ai 2026. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}
