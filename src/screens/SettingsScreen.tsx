import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Platform, Modal, Alert,
  StatusBar as RNStatusBar,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { settingsStore } from '../stores/SettingsStore';
import { chatStore } from '../stores/ChatStore';
import { modelStore } from '../stores/ModelStore';
import { getModelsDirectorySize, deleteModelFile, syncInstalledModelsFromDevice } from '../services/DownloadService';
import { releaseModel } from '../services/LlamaService';
import { useTheme, DesignTokens } from '../theme/theme';
import SettingsSlider from '../components/SettingsSlider';
import { authStore } from '../stores/AuthStore';
import { secretsStore } from '../stores/SecretsStore';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default observer(function SettingsScreen() {
  const navigation = useNavigation();
  const { Colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [storageUsage, setStorageUsage] = useState<string>('—');
  const s = settingsStore.inference;
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
      paddingBottom: 40,
    },
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginTop: 28,
      marginBottom: 12,
      marginLeft: 4,
    },
    presetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 18,
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    presetTextWrap: { flex: 1 },
    presetLabel: { 
      color: Colors.onSurface, 
      fontSize: 16, 
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    presetMeta: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 13, 
      marginTop: 4,
      fontWeight: '500',
      lineHeight: 18,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 18,
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    rowLabel: { 
      color: Colors.onSurface, 
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    rowValue: { 
      color: Colors.primary, 
      fontSize: 16, 
      fontWeight: '800' 
    },
    settingBlock: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 18,
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: 14,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    settingLabel: { 
      color: Colors.onSurface, 
      fontSize: 12, 
      fontWeight: '800', 
      textTransform: 'uppercase', 
      letterSpacing: 0.8 
    },
    settingHint: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 13, 
      marginVertical: 6, 
      marginBottom: 12, 
      lineHeight: 18,
      fontWeight: '500',
    },
    tokenInput: {
      backgroundColor: Colors.background,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      color: Colors.onSurface,
      fontSize: 15,
      borderWidth: 1.5,
      borderColor: Colors.border,
      fontWeight: '500',
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.error + '08',
      borderRadius: DesignTokens.borderRadius.lg,
      padding: 16,
      borderWidth: 1.5,
      borderColor: Colors.error + '22',
      marginBottom: 10,
    },
    dangerLabel: { 
      color: Colors.error, 
      fontSize: 15, 
      fontWeight: '700' 
    },
    modal: { flex: 1, backgroundColor: Colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'ios' ? 52 : 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    modalTitle: { 
      color: Colors.onSurface, 
      fontSize: 18, 
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    modalContent: { padding: 16 },
    numInput: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      color: Colors.onSurface,
      fontSize: 16,
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: 24,
      fontWeight: '600',
    },
    toggleRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 16, 
      marginBottom: 24 
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingBottom: Platform.OS === 'ios' ? 36 : 16,
      backgroundColor: Colors.surface,
    },
    resetBtn: { 
      flex: 1, 
      height: 50, 
      alignItems: 'center', 
      justifyContent: 'center',
      borderRadius: DesignTokens.borderRadius.md,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    resetText: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 14,
      fontWeight: '700',
    },
    saveBtn: {
      flex: 1,
      height: 50,
      backgroundColor: Colors.primary,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    saveText: { 
      color: Colors.onPrimary, 
      fontSize: 15, 
      fontWeight: '700' 
    },
  }), [Colors]);

  const refreshStorage = async () => {
    try {
      await syncInstalledModelsFromDevice();
      const bytes = await getModelsDirectorySize();
      setStorageUsage(formatBytes(bytes));
    } catch {
      setStorageUsage('—');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshStorage();
    }, []),
  );

  const handleClearChats = () => {
    Alert.alert('Clear All Chats', 'This will delete all conversations. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => chatStore.clearAllChats() },
    ]);
  };

  const handleDeleteAllModels = () => {
    Alert.alert(
      'Delete All Models',
      'Remove all downloaded models from this device? You can download them again from the Models screen. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await releaseModel();
              await syncInstalledModelsFromDevice();
              const list = [...modelStore.installedModels];
              for (const m of list) {
                await deleteModelFile(m);
              }
              refreshStorage();
            } catch {
              Alert.alert('Error', 'Failed to delete some models. Please try again.');
            }
          },
        },
      ],
    );
  };

  const hasOpenAIKey = secretsStore.openaiKey.trim().length > 0;
  const hasAnthropicKey = secretsStore.anthropicKey.trim().length > 0;
  const hasGeminiKey = secretsStore.geminiKey.trim().length > 0;

  const cloudProviders = [
    { key: 'openai' as const, label: 'OpenAI (ChatGPT)', enabled: hasOpenAIKey },
    { key: 'anthropic' as const, label: 'Anthropic (Claude)', enabled: hasAnthropicKey },
    { key: 'gemini' as const, label: 'Google (Gemini)', enabled: hasGeminiKey },
  ];

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Signed in as</Text>
          <Text style={styles.settingHint}>
            {authStore.user?.email ?? 'Not signed in'}{authStore.isSignedIn ? (authStore.isEmailVerified ? ' · Verified' : ' · Not verified') : ''}
          </Text>

          {!authStore.isSignedIn ? (
            <TouchableOpacity
              style={[styles.presetBtn, { marginBottom: 0, justifyContent: 'center' }]}
              onPress={() => (navigation as any).navigate('Auth')}
            >
              <MaterialCommunityIcons name="login" size={20} color={Colors.onSurface} />
              <Text style={styles.presetLabel}>Get Started</Text>
            </TouchableOpacity>
          ) : (
            <>
              {!authStore.isEmailVerified ? (
                <TouchableOpacity
                  style={[styles.presetBtn, { marginBottom: 8, justifyContent: 'center' }]}
                  onPress={() => authStore.resendVerification(authStore.user?.email ?? '')}
                >
                  <MaterialCommunityIcons name="email-fast-outline" size={20} color={Colors.onSurface} />
                  <Text style={styles.presetLabel}>Resend verification email</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.presetBtn, { marginBottom: 0, justifyContent: 'center' }]}
                onPress={() => authStore.signOut()}
              >
                <MaterialCommunityIcons name="logout" size={20} color={Colors.onSurface} />
                <Text style={styles.presetLabel}>Sign out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Chat Generation Preset */}
        <TouchableOpacity
          style={styles.presetBtn}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="tune-variant" size={20} color={Colors.onSurface} />
          <View style={styles.presetTextWrap}>
            <Text style={styles.presetLabel}>Chat Generation Settings</Text>
            <Text style={styles.presetMeta}>
              Temp {s.temperature} · Top-K {s.topK} · Top-P {s.topP}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.metaText} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>HUGGING FACE</Text>
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Access token (optional)</Text>
          <Text style={styles.settingHint}>
            For gated or private models. Requires verified email. Get a token at huggingface.co/settings/tokens
          </Text>
          <TextInput
            style={styles.tokenInput}
            value={secretsStore.hfToken}
            onChangeText={(v) => { void secretsStore.setSecret('hfToken', v); }}
            placeholder="hf_..."
            placeholderTextColor={Colors.metaText}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {authStore.isSignedIn && authStore.isEmailVerified ? (
          <>
            <Text style={styles.sectionLabel}>API KEYS (OPTIONAL)</Text>
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>OpenAI (ChatGPT) API key</Text>
              <Text style={styles.settingHint}>Stored securely on device. Used only if you enable cloud chat.</Text>
              <TextInput
                style={styles.tokenInput}
                value={secretsStore.openaiKey}
                onChangeText={(v) => {
                  void secretsStore.setSecret('openaiKey', v);
                  if (v.trim().length > 0) {
                    settingsStore.setApp('chatBackend', 'openai');
                  } else if (settingsStore.app.chatBackend === 'openai') {
                    settingsStore.setApp('chatBackend', 'local');
                  }
                }}
                placeholder="sk-..."
                placeholderTextColor={Colors.metaText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>Anthropic (Claude) API key</Text>
              <Text style={styles.settingHint}>Stored securely on device.</Text>
              <TextInput
                style={styles.tokenInput}
                value={secretsStore.anthropicKey}
                onChangeText={(v) => {
                  void secretsStore.setSecret('anthropicKey', v);
                  if (v.trim().length > 0) {
                    settingsStore.setApp('chatBackend', 'anthropic');
                  } else if (settingsStore.app.chatBackend === 'anthropic') {
                    settingsStore.setApp('chatBackend', 'local');
                  }
                }}
                placeholder="sk-ant-..."
                placeholderTextColor={Colors.metaText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>Google (Gemini) API key</Text>
              <Text style={styles.settingHint}>Stored securely on device.</Text>
              <TextInput
                style={styles.tokenInput}
                value={secretsStore.geminiKey}
                onChangeText={(v) => {
                  void secretsStore.setSecret('geminiKey', v);
                  if (v.trim().length > 0) {
                    settingsStore.setApp('chatBackend', 'gemini');
                  } else if (settingsStore.app.chatBackend === 'gemini') {
                    settingsStore.setApp('chatBackend', 'local');
                  }
                }}
                placeholder="AIza..."
                placeholderTextColor={Colors.metaText}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.sectionLabel}>CHAT PROVIDER</Text>
            <View style={styles.settingBlock}>
              <Text style={styles.settingLabel}>Backend</Text>
              <Text style={styles.settingHint}>
                Local uses downloaded GGUF models. Cloud uses your API key. Enter a provider key to unlock that provider.
              </Text>
              {[{ key: 'local' as const, label: 'Local (on-device)', enabled: true }, ...cloudProviders].map((opt) => {
                const active = settingsStore.app.chatBackend === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.row,
                      { marginBottom: 8, opacity: opt.enabled ? 1 : 0.5 },
                      active && { borderColor: Colors.primary },
                    ]}
                    onPress={() => {
                      if (!opt.enabled) return;
                      settingsStore.setApp('chatBackend', opt.key);
                    }}
                    disabled={!opt.enabled}
                  >
                    <Text style={styles.rowLabel}>{opt.label}</Text>
                    {active ? (
                      <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
                    ) : !opt.enabled ? (
                      <Text style={styles.settingHint}>Add API key</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {settingsStore.app.chatBackend === 'openai' && (
              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>OpenAI model</Text>
                <Text style={styles.settingHint}>Select a model or type a custom ID below.</Text>
                {[
                  { id: 'gpt-4.1',      label: 'GPT-4.1  · Recommended · 1M ctx' },
                  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini  · Fast & cheap' },
                  { id: 'o3',           label: 'o3  · Best reasoning' },
                  { id: 'o4-mini',      label: 'o4-mini  · Fast reasoning' },
                ].map(({ id, label }) => {
                  const active = settingsStore.app.openaiModel === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.row, { marginBottom: 8 }, active && { borderColor: Colors.primary }]}
                      onPress={() => settingsStore.setApp('openaiModel', id)}
                    >
                      <Text style={styles.rowLabel}>{label}</Text>
                      {active ? <MaterialCommunityIcons name="check" size={18} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
                <TextInput
                  style={styles.tokenInput}
                  value={settingsStore.app.openaiModel}
                  onChangeText={(v) => settingsStore.setApp('openaiModel', v)}
                  placeholder="gpt-4.1"
                  placeholderTextColor={Colors.metaText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            {settingsStore.app.chatBackend === 'anthropic' && (
              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>Claude model</Text>
                <Text style={styles.settingHint}>Select a model or type a custom ID below.</Text>
                {[
                  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6  · Best speed + intelligence' },
                  { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6  · Most intelligent · 1M ctx' },
                  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5  · Fastest / cheapest' },
                ].map(({ id, label }) => {
                  const active = settingsStore.app.anthropicModel === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.row, { marginBottom: 8 }, active && { borderColor: Colors.primary }]}
                      onPress={() => settingsStore.setApp('anthropicModel', id)}
                    >
                      <Text style={styles.rowLabel}>{label}</Text>
                      {active ? <MaterialCommunityIcons name="check" size={18} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
                <TextInput
                  style={styles.tokenInput}
                  value={settingsStore.app.anthropicModel}
                  onChangeText={(v) => settingsStore.setApp('anthropicModel', v)}
                  placeholder="claude-sonnet-4-6"
                  placeholderTextColor={Colors.metaText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            {settingsStore.app.chatBackend === 'gemini' && (
              <View style={styles.settingBlock}>
                <Text style={styles.settingLabel}>Gemini model</Text>
                <Text style={styles.settingHint}>Select a model or type a custom ID below.</Text>
                {[
                  { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash  · Best price-performance' },
                  { id: 'gemini-2.5-flash-lite',  label: 'Gemini 2.5 Flash-Lite  · Fastest / cheapest' },
                  { id: 'gemini-2.5-pro',         label: 'Gemini 2.5 Pro  · Most capable · 1M ctx' },
                ].map(({ id, label }) => {
                  const active = settingsStore.app.geminiModel === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.row, { marginBottom: 8 }, active && { borderColor: Colors.primary }]}
                      onPress={() => settingsStore.setApp('geminiModel', id)}
                    >
                      <Text style={styles.rowLabel}>{label}</Text>
                      {active ? <MaterialCommunityIcons name="check" size={18} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
                <TextInput
                  style={styles.tokenInput}
                  value={settingsStore.app.geminiModel}
                  onChangeText={(v) => settingsStore.setApp('geminiModel', v)}
                  placeholder="gemini-2.5-flash"
                  placeholderTextColor={Colors.metaText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>CLOUD AI</Text>
            <TouchableOpacity
              style={[styles.settingBlock, { alignItems: 'center', gap: 10, paddingVertical: 24 }]}
              onPress={() => (navigation as any).navigate('Auth')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="lock-outline" size={28} color={Colors.primary} />
              <Text style={[styles.settingLabel, { textTransform: 'none', fontSize: 15, fontWeight: '700' }]}>
                Sign in to unlock Cloud AI
              </Text>
              <Text style={[styles.settingHint, { textAlign: 'center', marginBottom: 0 }]}>
                Access ChatGPT, Claude, and Gemini models by signing in and adding your API keys.
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionLabel}>APP</Text>

        {/* Appearance: Light / Dark mode */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Switch
            value={settingsStore.app.darkMode}
            onValueChange={v => settingsStore.setApp('darkMode', v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.onSurface}
          />
        </View>
        <Text style={styles.settingHint}>Turn off for light mode</Text>

        {/* GPU Layers */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>GPU Layers</Text>
          <Text style={styles.settingHint}>Higher = more GPU acceleration (Metal on iOS)</Text>
          <SettingsSlider
            label="GPU Layers"
            value={s.gpuLayers}
            min={0}
            max={99}
            step={1}
            decimals={0}
            onValueChange={v => settingsStore.setInference('gpuLayers', Math.round(v))}
          />
        </View>

        <Text style={styles.sectionLabel}>STORAGE</Text>

        {/* Storage usage */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Model Storage</Text>
          <Text style={styles.rowValue}>{storageUsage}</Text>
        </View>

        <Text style={styles.sectionLabel}>DATA</Text>

        {/* Clear chats */}
        <TouchableOpacity style={styles.dangerRow} onPress={handleClearChats}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
          <Text style={styles.dangerLabel}>Clear All Chats</Text>
        </TouchableOpacity>

        {/* Delete all models */}
        <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAllModels}>
          <MaterialCommunityIcons name="database-off-outline" size={20} color={Colors.error} />
          <Text style={styles.dangerLabel}>Delete All Models</Text>
        </TouchableOpacity>

        {authStore.isSignedIn && (
          <>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete your account, all conversations, and all downloaded models. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete My Account',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const deleted = await authStore.deleteAccount();
                          if (!deleted) {
                            Alert.alert('Error', authStore.error ?? 'Failed to delete account. Please try again or contact support.');
                            return;
                          }
                          chatStore.clearAllChats();
                          try {
                            await releaseModel();
                            const list = [...modelStore.installedModels];
                            for (const m of list) {
                              await deleteModelFile(m);
                            }
                          } catch {}
                          Alert.alert('Account Deleted', 'Your account and all data have been permanently removed.');
                        } catch {
                          Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <MaterialCommunityIcons name="account-remove-outline" size={20} color={Colors.error} />
              <Text style={styles.dangerLabel}>Delete Account</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Inference Settings Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Generation Settings (Preset)</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* N Predict */}
            <Text style={styles.settingLabel}>N PREDICT</Text>
            <Text style={styles.settingHint}>
              Max tokens to generate. If replies or stories stop too soon, try 2048 or 4096.
            </Text>
            <TextInput
              style={styles.numInput}
              value={String(s.nPredict)}
              onChangeText={t => {
                const n = parseInt(t, 10);
                if (!isNaN(n)) settingsStore.setInference('nPredict', n);
              }}
              keyboardType="number-pad"
              placeholderTextColor={Colors.metaText}
            />

            {/* Include Thinking */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>INCLUDE THINKING IN CONTEXT</Text>
                <Text style={styles.settingHint}>
                  Include AI thinking/reasoning parts in context. Disabling saves context space.
                </Text>
              </View>
              <Switch
                value={s.includeThinkingInContext}
                onValueChange={v => settingsStore.setInference('includeThinkingInContext', v)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.onSurface}
              />
            </View>

            {/* Temperature */}
            <Text style={styles.settingLabel}>TEMPERATURE</Text>
            <Text style={styles.settingHint}>
              Control creativity vs predictability. Higher values make responses more creative.
            </Text>
            <SettingsSlider
              label="Temperature"
              value={s.temperature}
              min={0}
              max={2}
              step={0.05}
              decimals={2}
              onValueChange={v => settingsStore.setInference('temperature', parseFloat(v.toFixed(2)))}
            />

            {/* Top K */}
            <Text style={styles.settingLabel}>TOP K</Text>
            <Text style={styles.settingHint}>
              Control creativity by limiting word choices to the K most likely options.
            </Text>
            <SettingsSlider
              label="Top K"
              value={s.topK}
              min={1}
              max={100}
              step={1}
              decimals={0}
              onValueChange={v => settingsStore.setInference('topK', Math.round(v))}
            />

            {/* Top P */}
            <Text style={styles.settingLabel}>TOP P</Text>
            <Text style={styles.settingHint}>
              Balance creativity and coherence. Higher values (near 1.0) allow more creative responses.
            </Text>
            <SettingsSlider
              label="Top P"
              value={s.topP}
              min={0}
              max={1}
              step={0.05}
              decimals={2}
              onValueChange={v => settingsStore.setInference('topP', parseFloat(v.toFixed(2)))}
            />

            {/* Min P */}
            <Text style={styles.settingLabel}>MIN P</Text>
            <SettingsSlider
              label="Min P"
              value={s.minP}
              min={0}
              max={1}
              step={0.01}
              decimals={2}
              onValueChange={v => settingsStore.setInference('minP', parseFloat(v.toFixed(2)))}
            />

            {/* Repeat Penalty */}
            <Text style={styles.settingLabel}>REPEAT PENALTY</Text>
            <SettingsSlider
              label="Repeat Penalty"
              value={s.repeatPenalty}
              min={1}
              max={2}
              step={0.05}
              decimals={2}
              onValueChange={v => settingsStore.setInference('repeatPenalty', parseFloat(v.toFixed(2)))}
            />

            {/* Context Length */}
            <Text style={styles.settingLabel}>CONTEXT LENGTH</Text>
            <SettingsSlider
              label="Context Length"
              value={s.contextLength}
              min={512}
              max={8192}
              step={512}
              decimals={0}
              onValueChange={v => settingsStore.setInference('contextLength', Math.round(v))}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => settingsStore.resetInferenceToDefaults()}
            >
              <Text style={styles.resetText}>Reset to System Defaults</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

