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
import { settingsStore } from '../stores/SettingsStore';
import { initModel, isRunningInExpoGo, LLAMA_UNAVAILABLE_MESSAGE } from '../services/LlamaService';
import { authStore } from '../stores/AuthStore';
import { secretsStore } from '../stores/SecretsStore';
import { useTheme, DesignTokens } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

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
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
      padding: 16,
      paddingBottom: 40,
    },

    // Intro section
    introRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    introIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: Colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    introText: {
      flex: 1,
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },

    // Section label
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 12,
      marginLeft: 2,
    },

    // Pal card
    palCard: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.lg,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    palCardBody: {
      padding: 16,
    },
    palTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    emojiCircle: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    palEmoji: { fontSize: 28 },
    palInfo: { flex: 1, marginRight: 4 },
    palName: {
      color: Colors.onSurface,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    palDesc: {
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      marginTop: 3,
      lineHeight: 18,
      fontWeight: '500',
    },
    tempBadge: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tempBadgeText: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '700',
    },

    // System prompt preview
    promptPreview: {
      marginTop: 12,
      backgroundColor: Colors.background,
      borderRadius: 10,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
    },
    promptLabel: {
      color: Colors.metaText,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    promptText: {
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '500',
      fontStyle: 'italic',
    },

    // Card footer
    palFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surfaceVariant + '60',
    },
    footerAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
    },
    footerDivider: {
      width: 1,
      height: 20,
      backgroundColor: Colors.border,
    },
    footerText: {
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '600',
    },
    footerChatText: {
      color: Colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },

    // Empty state
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: Colors.primary + '12',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyTitle: {
      color: Colors.onSurface,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    emptyDesc: {
      color: Colors.onSurfaceVariant,
      fontSize: 13,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: Colors.primary,
      borderRadius: DesignTokens.borderRadius.md,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    emptyBtnText: {
      color: Colors.onPrimary,
      fontSize: 14,
      fontWeight: '700',
    },

    // Modal
    modal: { flex: 1, backgroundColor: Colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      paddingTop: Platform.OS === 'ios' ? 52 : 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    modalTitle: {
      color: Colors.onSurface,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    modalContent: { padding: 16, paddingBottom: 32 },
    fieldLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 20,
    },
    fieldInput: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      color: Colors.onSurface,
      fontSize: 15,
      borderWidth: 1,
      borderColor: Colors.border,
      fontWeight: '500',
    },
    fieldHint: {
      color: Colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 8,
      fontWeight: '500',
    },
    fieldInputLarge: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    modelOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    modelOptionSelected: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '08',
    },
    modelOptionText: {
      color: Colors.onSurface,
      fontSize: 14,
      flex: 1,
      fontWeight: '600',
    },
    emojiRow: { marginBottom: 8 },
    emojiOption: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.surfaceVariant,
      marginRight: 8,
    },
    emojiSelected: {
      borderWidth: 2,
      borderColor: Colors.primary,
      backgroundColor: Colors.primary + '10',
    },
    emojiOptionText: { fontSize: 24 },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingBottom: Platform.OS === 'ios' ? 36 : 16,
      backgroundColor: Colors.surface,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: DesignTokens.borderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cancelText: {
      color: Colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: '700',
    },
    saveBtn: {
      flex: 1,
      height: 48,
      backgroundColor: Colors.primary,
      borderRadius: DesignTokens.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      color: Colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
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
    const backend = settingsStore.app.chatBackend;
    const isAuth = authStore.isSignedIn && authStore.isEmailVerified;
    const hasKey = backend === 'openai' ? secretsStore.openaiKey.trim().length > 0
      : backend === 'anthropic' ? secretsStore.anthropicKey.trim().length > 0
      : backend === 'gemini' ? secretsStore.geminiKey.trim().length > 0
      : false;

    if (backend !== 'local' && isAuth && hasKey) {
      chatStore.createConversation(`cloud-${backend}`, pal.id);
      (navigation as any).navigate('Chat');
      return;
    }

    let modelIdToUse = modelStore.activeModel?.id;

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
              loadResult.errorMessage ?? (isRunningInExpoGo() ? LLAMA_UNAVAILABLE_MESSAGE : 'Could not load this Pal\'s default model.'),
            );
            return;
          }
        }
      }
    }

    if (!modelStore.isModelLoaded || !modelIdToUse) {
      Alert.alert('No Model Loaded', 'Load a model from Models screen, or switch to a cloud provider in Settings.');
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

  const EMOJI_COLORS: Record<string, string> = {
    '💻': '#6366F1', '📚': '#8B5CF6', '✍️': '#EC4899', '🎭': '#F59E0B',
    '🧠': '#EF4444', '🔬': '#10B981', '🎨': '#0EA5E9', '🏋️': '#F97316',
    '🍳': '#84CC16', '🌍': '#06B6D4', '🎵': '#A855F7', '🤖': '#7C3AED',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MaterialCommunityIcons name="menu" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pals</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Intro */}
        <View style={styles.introRow}>
          <View style={styles.introIconWrap}>
            <MaterialCommunityIcons name="star-four-points-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.introText}>
            Pals are AI personas with custom personalities. Each has its own system prompt, temperature, and optional model.
          </Text>
        </View>

        {palStore.pals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="account-plus-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Pals Yet</Text>
            <Text style={styles.emptyDesc}>
              Create your first AI persona to get started.{'\n'}Each Pal remembers its personality across chats.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate} activeOpacity={0.8}>
              <MaterialCommunityIcons name="plus" size={18} color={Colors.onPrimary} />
              <Text style={styles.emptyBtnText}>Create Pal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{palStore.pals.length} Pal{palStore.pals.length !== 1 ? 's' : ''}</Text>

            {palStore.pals.map(pal => {
              const accentColor = EMOJI_COLORS[pal.emoji] || Colors.primary;
              return (
                <View key={pal.id} style={styles.palCard}>
                  <View style={styles.palCardBody}>
                    <View style={styles.palTopRow}>
                      <View style={[styles.emojiCircle, { backgroundColor: accentColor + '18' }]}>
                        <Text style={styles.palEmoji}>{pal.emoji}</Text>
                      </View>
                      <View style={styles.palInfo}>
                        <Text style={styles.palName}>{pal.name}</Text>
                        <Text style={styles.palDesc} numberOfLines={2}>{pal.description}</Text>
                      </View>
                      <View style={styles.tempBadge}>
                        <Text style={styles.tempBadgeText}>{pal.temperature}</Text>
                      </View>
                    </View>

                    <View style={styles.promptPreview}>
                      <Text style={styles.promptLabel}>System Prompt</Text>
                      <Text style={styles.promptText} numberOfLines={2}>{pal.systemPrompt}</Text>
                    </View>
                  </View>

                  {/* Footer actions */}
                  <View style={styles.palFooter}>
                    <TouchableOpacity
                      style={styles.footerAction}
                      onPress={() => openEdit(pal)}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.onSurfaceVariant} />
                      <Text style={styles.footerText}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.footerDivider} />
                    <TouchableOpacity
                      style={styles.footerAction}
                      onPress={() => handleStartChat(pal)}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons name="chat-outline" size={16} color={Colors.primary} />
                      <Text style={styles.footerChatText}>Chat</Text>
                    </TouchableOpacity>
                    <View style={styles.footerDivider} />
                    <TouchableOpacity
                      style={styles.footerAction}
                      onPress={() => handleDelete(pal)}
                      activeOpacity={0.6}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.error} />
                      <Text style={[styles.footerText, { color: Colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingPal ? 'Edit Pal' : 'Create Pal'}</Text>
            <TouchableOpacity onPress={() => setCreateModal(false)}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalContent}>
            <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled style={styles.emojiRow}>
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

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coding Assistant"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.fieldInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Short description of this pal"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>System Prompt</Text>
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

            <Text style={styles.fieldLabel}>Temperature</Text>
            <Text style={styles.fieldHint}>Lower = focused, Higher = creative (0.0 – 2.0)</Text>
            <TextInput
              style={styles.fieldInput}
              value={temperature}
              onChangeText={setTemperature}
              keyboardType="decimal-pad"
              placeholder="0.7"
              placeholderTextColor={Colors.metaText}
            />

            <Text style={styles.fieldLabel}>Default Model (Optional)</Text>
            <Text style={styles.fieldHint}>Auto-loads this model when chatting with this Pal</Text>
            <TouchableOpacity
              style={[styles.fieldInput, styles.modelOption, !defaultModelId && styles.modelOptionSelected]}
              onPress={() => setDefaultModelId(undefined)}
            >
              <Text style={styles.modelOptionText}>None (use current model)</Text>
              {!defaultModelId && <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />}
            </TouchableOpacity>
            {modelStore.installedModels.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.fieldInput, styles.modelOption, defaultModelId === m.id && styles.modelOptionSelected]}
                onPress={() => setDefaultModelId(m.id)}
              >
                <Text style={styles.modelOptionText} numberOfLines={1}>{m.displayName}</Text>
                {defaultModelId === m.id && <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveText}>{editingPal ? 'Save Changes' : 'Create Pal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});
