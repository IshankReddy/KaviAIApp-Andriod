import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Platform, Modal, Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { settingsStore } from '../stores/SettingsStore';
import { chatStore } from '../stores/ChatStore';
import { modelStore } from '../stores/ModelStore';
import { getModelsDirectorySize, deleteModelFile, syncInstalledModelsFromDevice } from '../services/DownloadService';
import { releaseModel } from '../services/LlamaService';
import { useTheme } from '../theme/theme';
import SettingsSlider from '../components/SettingsSlider';

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
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingTop: Platform.OS === 'ios' ? 50 : 12,
      paddingBottom: 10,
      paddingHorizontal: 8,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    headerTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 16, fontWeight: '600' },
    content: { padding: 16 },
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 8,
      marginLeft: 4,
    },
    presetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 8,
    },
    presetTextWrap: { flex: 1 },
    presetLabel: { color: Colors.onSurface, fontSize: 14, fontWeight: '500' },
    presetMeta: { color: Colors.metaText, fontSize: 12, marginTop: 2 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 8,
    },
    rowLabel: { color: Colors.onSurface, fontSize: 14 },
    rowValue: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
    settingBlock: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 8,
    },
    settingLabel: { color: Colors.onSurface, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    settingHint: { color: Colors.metaText, fontSize: 12, marginVertical: 4, marginBottom: 10, lineHeight: 16 },
    tokenInput: {
      backgroundColor: Colors.surface,
      borderRadius: 8,
      padding: 12,
      color: Colors.onSurface,
      fontSize: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.error + '44',
      marginBottom: 8,
    },
    dangerLabel: { color: Colors.error, fontSize: 14 },
    modal: { flex: 1, backgroundColor: Colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 52 : 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    modalTitle: { color: Colors.onSurface, fontSize: 16, fontWeight: '600' },
    modalContent: { padding: 16 },
    numInput: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 8,
      padding: 12,
      color: Colors.onSurface,
      fontSize: 15,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 20,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    resetBtn: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
    resetText: { color: Colors.onSurfaceVariant, fontSize: 14 },
    saveBtn: {
      flex: 1,
      backgroundColor: Colors.primary,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: { color: Colors.onPrimary, fontSize: 14, fontWeight: '600' },
  }), [Colors]);

  const refreshStorage = async () => {
    await syncInstalledModelsFromDevice();
    const bytes = await getModelsDirectorySize();
    setStorageUsage(formatBytes(bytes));
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
            await releaseModel();
            await syncInstalledModelsFromDevice();
            const list = [...modelStore.installedModels];
            for (const m of list) {
              await deleteModelFile(m);
            }
            refreshStorage();
          },
        },
      ],
    );
  };

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
            For gated or private models. Get a token at huggingface.co/settings/tokens
          </Text>
          <TextInput
            style={styles.tokenInput}
            value={settingsStore.app.hfAccessToken}
            onChangeText={(v) => settingsStore.setApp('hfAccessToken', v)}
            placeholder="hf_..."
            placeholderTextColor={Colors.metaText}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

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

        {/* Delete all models (PDR) */}
        <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAllModels}>
          <MaterialCommunityIcons name="database-off-outline" size={20} color={Colors.error} />
          <Text style={styles.dangerLabel}>Delete All Models</Text>
        </TouchableOpacity>
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

