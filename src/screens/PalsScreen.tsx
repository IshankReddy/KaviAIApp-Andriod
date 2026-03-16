import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Modal, TextInput, Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palStore, Pal } from '../stores/PalStore';
import { chatStore } from '../stores/ChatStore';
import { modelStore } from '../stores/ModelStore';
import { initModel, isRunningInExpoGo, LLAMA_UNAVAILABLE_MESSAGE } from '../services/LlamaService';
import { useTheme } from '../theme/theme';

const EMOJI_OPTIONS = ['💻', '📚', '✍️', '🎭', '🧠', '🔬', '🎨', '🏋️', '🍳', '🌍', '🎵', '🤖'];

export default observer(function PalsScreen() {
  const navigation = useNavigation();
  const { Colors } = useTheme();
  const [createModal, setCreateModal] = useState(false);
  const [editingPal, setEditingPal] = useState<Pal | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🤖');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [defaultModelId, setDefaultModelId] = useState<string | undefined>(undefined);

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
    content: { padding: 16, paddingBottom: 40 },
    hint: { color: Colors.metaText, fontSize: 13, marginBottom: 16, textAlign: 'center' },
    palCard: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    palHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
    emojiCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    palEmoji: { fontSize: 24 },
    palInfo: { flex: 1 },
    palName: { color: Colors.onSurface, fontSize: 15, fontWeight: '600' },
    palDesc: { color: Colors.metaText, fontSize: 12, marginTop: 2 },
    palActions: { flexDirection: 'row', gap: 4 },
    actionBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    sysPromptPreview: {
      color: Colors.onSurfaceVariant,
      fontSize: 12,
      fontStyle: 'italic',
      marginBottom: 10,
      borderLeftWidth: 2,
      borderLeftColor: Colors.primary,
      paddingLeft: 8,
    },
    palFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tempLabel: { color: Colors.metaText, fontSize: 12 },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chatBtnText: { color: Colors.onPrimary, fontSize: 13, fontWeight: '600' },
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
    modalTitle: { color: Colors.onSurface, fontSize: 17, fontWeight: '600' },
    modalContent: { padding: 16 },
    fieldLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 14,
    },
    fieldInput: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 10,
      padding: 12,
      color: Colors.onSurface,
      fontSize: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    fieldHint: { color: Colors.metaText, fontSize: 12, marginBottom: 6 },
    fieldInputLarge: { minHeight: 100, textAlignVertical: 'top' },
    modelOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    modelOptionSelected: { borderColor: Colors.primary },
    modelOptionText: { color: Colors.onSurface, fontSize: 14, flex: 1 },
    emojiRow: { marginBottom: 4 },
    emojiOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.surfaceVariant,
      marginRight: 8,
    },
    emojiSelected: { borderWidth: 2, borderColor: Colors.primary },
    emojiOptionText: { fontSize: 24 },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    },
    cancelBtn: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: Colors.onSurfaceVariant, fontSize: 14 },
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

  const openCreate = () => {
    setEditingPal(null);
    setName(''); setEmoji('🤖'); setDescription('');
    setSystemPrompt(''); setTemperature('0.7'); setDefaultModelId(undefined);
    setCreateModal(true);
  };

  const openEdit = (pal: Pal) => {
    setEditingPal(pal);
    setName(pal.name); setEmoji(pal.emoji);
    setDescription(pal.description); setSystemPrompt(pal.systemPrompt);
    setTemperature(String(pal.temperature));
    setDefaultModelId(pal.defaultModelId);
    setCreateModal(true);
  };

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim()) {
      Alert.alert('Required', 'Name and System Prompt are required.');
      return;
    }
    const data = {
      name: name.trim(),
      emoji,
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      temperature: parseFloat(temperature) || 0.7,
      defaultModelId: defaultModelId || undefined,
    };
    if (editingPal) {
      palStore.updatePal(editingPal.id, data);
    } else {
      palStore.createPal(data);
    }
    setCreateModal(false);
  };

  const handleStartChat = async (pal: Pal) => {
    let modelIdToUse = modelStore.activeModel?.id;

    // If Pal has a default model and it's installed, use it (and load if needed)
    if (pal.defaultModelId) {
      const defaultModel = modelStore.installedModels.find(m => m.id === pal.defaultModelId);
      if (defaultModel) {
        modelIdToUse = defaultModel.id;
        if (modelStore.activeModel?.id !== defaultModel.id || !modelStore.isModelLoaded) {
          modelStore.setActiveModel(defaultModel);
          const loadResult = await initModel(defaultModel.filePath);
          if (!loadResult.success) {
            Alert.alert(
              'Load Failed',
              loadResult.errorMessage ?? (isRunningInExpoGo() ? LLAMA_UNAVAILABLE_MESSAGE : 'Could not load this Pal\'s default model. Try loading it from the Models screen.'),
            );
            return;
          }
        }
      }
    }

    if (!modelStore.isModelLoaded || !modelIdToUse) {
      Alert.alert('No Model Loaded', 'Please load a model from the Models screen before chatting.');
      return;
    }
    chatStore.createConversation(modelIdToUse, pal.id);
    (navigation as any).navigate('Chat');
  };

  const handleDelete = (pal: Pal) => {
    Alert.alert('Delete Pal', `Delete "${pal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => palStore.deletePal(pal.id) },
    ]);
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
        <Text style={styles.headerTitle}>Pals</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>Create AI personas with custom personalities and system prompts</Text>

        {palStore.pals.map(pal => (
          <View key={pal.id} style={styles.palCard}>
            <View style={styles.palHeader}>
              <View style={styles.emojiCircle}>
                <Text style={styles.palEmoji}>{pal.emoji}</Text>
              </View>
              <View style={styles.palInfo}>
                <Text style={styles.palName}>{pal.name}</Text>
                <Text style={styles.palDesc} numberOfLines={2}>{pal.description}</Text>
              </View>
              <View style={styles.palActions}>
                <TouchableOpacity onPress={() => openEdit(pal)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(pal)} style={styles.actionBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.sysPromptPreview} numberOfLines={2}>{pal.systemPrompt}</Text>
            <View style={styles.palFooter}>
              <Text style={styles.tempLabel}>Temp: {pal.temperature}</Text>
              <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(pal)}>
                <MaterialCommunityIcons name="chat-outline" size={14} color={Colors.onPrimary} />
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingPal ? 'Edit Pal' : 'Create Pal'}</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Emoji picker */}
            <Text style={styles.fieldLabel}>EMOJI</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {EMOJI_OPTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, emoji === e && styles.emojiSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={styles.emojiOptionText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>NAME</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coding Assistant"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.fieldInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Short description of this pal"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>SYSTEM PROMPT</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputLarge]}
              value={systemPrompt}
              onChangeText={setSystemPrompt}
              placeholder="You are a helpful assistant..."
              placeholderTextColor={Colors.metaText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>TEMPERATURE</Text>
            <TextInput
              style={styles.fieldInput}
              value={temperature}
              onChangeText={setTemperature}
              keyboardType="decimal-pad"
              placeholder="0.7"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>DEFAULT MODEL (OPTIONAL)</Text>
            <Text style={styles.fieldHint}>Model to load when starting a chat with this Pal</Text>
            <TouchableOpacity
              style={[styles.fieldInput, styles.modelOption, !defaultModelId && styles.modelOptionSelected]}
              onPress={() => setDefaultModelId(undefined)}
            >
              <Text style={styles.modelOptionText}>None (use current model)</Text>
              {!defaultModelId && <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />}
            </TouchableOpacity>
            {modelStore.installedModels.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.fieldInput, styles.modelOption, defaultModelId === m.id && styles.modelOptionSelected]}
                onPress={() => setDefaultModelId(m.id)}
              >
                <Text style={styles.modelOptionText} numberOfLines={1}>{m.displayName}</Text>
                {defaultModelId === m.id && <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save Pal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});
