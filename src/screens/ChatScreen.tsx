import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatStore } from '../stores/ChatStore';
import { modelStore } from '../stores/ModelStore';
import { settingsStore } from '../stores/SettingsStore';
import { palStore } from '../stores/PalStore';
import { generateResponse, stopGeneration, initModel, isRunningInExpoGo, LLAMA_UNAVAILABLE_MESSAGE } from '../services/LlamaService';
import { generateCloudResponse } from '../services/CloudChatService';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { useTheme, DesignTokens } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { secretsStore } from '../stores/SecretsStore';
import { authStore } from '../stores/AuthStore';

const LOGO = require('../../assets/logo.png');

function shortModelName(displayName: string): string {
  const match = displayName.match(/^([A-Za-z]+)/);
  return match ? match[1] : displayName.slice(0, 12);
}

const CAPABILITIES = [
  { icon: 'shield-lock-outline' as const, title: 'Private', desc: 'All data stays on device' },
  { icon: 'wifi-off' as const,            title: 'Offline', desc: 'No internet required' },
  { icon: 'lightning-bolt' as const,       title: 'Fast',    desc: 'GPU-accelerated inference' },
];

export default observer(function ChatScreen() {
  const { Colors } = useTheme();
  const navigation = useNavigation();
  const flatRef = useRef<FlatList>(null);
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
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { 
      color: Colors.onSurface, 
      fontSize: 17, 
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSubtitle: { 
      color: Colors.primary, 
      fontSize: 10, 
      marginTop: 2,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    headerActions: { flexDirection: 'row', gap: 4 },

    emptyState: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingHorizontal: 28,
    },
    logoWrap: {
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      borderWidth: 2,
      borderColor: Colors.primary + '25',
      ...Platform.select({
        ios: {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: { elevation: 10 },
      }),
    },
    logo: { width: 90, height: 90 },
    emptyTitle: { 
      color: Colors.onSurface, 
      fontSize: 26, 
      fontWeight: '900', 
      marginBottom: 8, 
      textAlign: 'center',
      letterSpacing: -0.8,
    },
    emptySubtitle: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 14, 
      textAlign: 'center', 
      lineHeight: 21, 
      marginBottom: 28,
      fontWeight: '500',
    },
    capsRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginBottom: 28,
    },
    capCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 6,
      borderRadius: DesignTokens.borderRadius.md,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    capIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: Colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    capTitle: {
      color: Colors.onSurface,
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 2,
    },
    capDesc: {
      color: Colors.onSurfaceVariant,
      fontSize: 10,
      fontWeight: '500',
      textAlign: 'center',
    },
    downloadBtn: {
      flexDirection: 'row',
      borderRadius: DesignTokens.borderRadius.lg,
      paddingHorizontal: 32,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      overflow: 'hidden',
    },
    downloadBtnText: { 
      color: Colors.onPrimary, 
      fontSize: 15, 
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    copyright: {
      color: Colors.metaText,
      fontSize: 10,
      fontWeight: '600',
      marginTop: 20,
      letterSpacing: 0.5,
      opacity: 0.6,
    },

    chatArea: { flex: 1 },
    messageList: { 
      paddingVertical: DesignTokens.spacing.sm, 
      paddingBottom: DesignTokens.spacing.xl,
    },
    loadingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 10,
      backgroundColor: Colors.surfaceVariant,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: DesignTokens.borderRadius.sm,
    },
    loadingText: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 13, 
      fontWeight: '600' 
    },
    notLoadedBar: {
      flexDirection: 'row',
      backgroundColor: Colors.primary + '10',
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: DesignTokens.borderRadius.sm,
      borderWidth: 1,
      borderColor: Colors.primary + '25',
    },
    notLoadedText: { 
      color: Colors.primary, 
      fontSize: 13, 
      fontWeight: '700',
      flex: 1,
    },
  }), [Colors]);

  const hasModels = modelStore.hasModels;
  const isModelLoaded = modelStore.isModelLoaded;
  const isGenerating = chatStore.isGenerating;
  const messages = chatStore.messages;
  const activeConv = chatStore.activeConversation;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length, chatStore.streamingContent]);

  const cloudBackend = settingsStore.app.chatBackend;
  const hasCloudKey = (() => {
    if (cloudBackend === 'openai') return secretsStore.openaiKey.trim().length > 0;
    if (cloudBackend === 'anthropic') return secretsStore.anthropicKey.trim().length > 0;
    if (cloudBackend === 'gemini') return secretsStore.geminiKey.trim().length > 0;
    return false;
  })();
  const isCloudBackend = cloudBackend !== 'local' && hasCloudKey && authStore.isSignedIn && authStore.isEmailVerified;

  const cloudModelId = (() => {
    const b = settingsStore.app.chatBackend;
    if (b === 'openai') return settingsStore.app.openaiModel;
    if (b === 'anthropic') return settingsStore.app.anthropicModel;
    if (b === 'gemini') return settingsStore.app.geminiModel;
    return '';
  })();

  useEffect(() => {
    if (!activeConv) {
      if (isCloudBackend) {
        chatStore.createConversation(`cloud-${cloudModelId || settingsStore.app.chatBackend}`);
      } else if (isModelLoaded && modelStore.activeModel) {
        chatStore.createConversation(modelStore.activeModel.id);
      }
    }
  }, [isModelLoaded, modelStore.activeModel, isCloudBackend, activeConv, cloudModelId]);

  const handleSend = async (text: string) => {
    const useCloud = isCloudBackend;
    if (!useCloud && !isModelLoaded) return;

    if (!chatStore.activeConversation) {
      const mid = useCloud
        ? `cloud-${cloudModelId || settingsStore.app.chatBackend}`
        : (modelStore.activeModel?.id ?? '');
      if (!mid) return;
      chatStore.createConversation(mid);
    }

    chatStore.addUserMessage(text);
    const conv = chatStore.activeConversation;
    const activePal = conv?.palId ? palStore.getPal(conv.palId) : null;
    const systemPrompt = activePal?.systemPrompt ?? 'You are a helpful AI assistant.';

    if (!useCloud) {
      await generateResponse(systemPrompt);
      return;
    }

    const historyForApi = [...chatStore.messages];
    chatStore.startAssistantMessage();
    try {
      const reply = await generateCloudResponse(systemPrompt, historyForApi);
      chatStore.appendToken(reply);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'Request failed';
      chatStore.appendToken(`Error: ${msg}`);
    } finally {
      chatStore.finalizeAssistantMessage({ msPerToken: 0, tokensPerSec: 0, ttftMs: 0, tokenCount: 0 });
    }
  };

  const headerTitle = (() => {
    if (!activeConv) return 'Chat';
    return activeConv.title.length > 0 ? activeConv.title : 'Chat';
  })();

  const headerSubtitle = (() => {
    if (!isCloudBackend) return modelStore.activeModel?.displayName ?? '';
    return cloudModelId;
  })();

  const inputDisabled = isCloudBackend
    ? isGenerating
    : (!isModelLoaded || isGenerating);

  const getConversationModelId = () => {
    if (isCloudBackend) return `cloud-${cloudModelId || settingsStore.app.chatBackend}`;
    return modelStore.activeModel?.id ?? '';
  };

  const handleChatMenu = () => {
    if (activeConv) {
      Alert.alert('Chat', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Conversation',
          style: 'destructive',
          onPress: () => {
            if (activeConv) {
              chatStore.deleteConversation(activeConv.id);
              const mid = getConversationModelId();
              if (mid) chatStore.createConversation(mid);
            }
          },
        },
      ]);
    }
  };

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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          {headerSubtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{headerSubtitle}</Text>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              const mid = getConversationModelId();
              if (mid) chatStore.createConversation(mid);
            }}
          >
            <MaterialCommunityIcons name="square-edit-outline" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          {activeConv && (
            <TouchableOpacity style={styles.headerBtn} onPress={handleChatMenu}>
              <MaterialCommunityIcons name="dots-vertical" size={20} color={Colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Empty state */}
      {!hasModels && !isCloudBackend ? (
        <View style={styles.emptyState}>
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.emptyTitle}>Welcome to KaviAI</Text>
          <Text style={styles.emptySubtitle}>
            Run AI models privately on your device.{'\n'}No cloud, no data leaves your phone.
          </Text>

          <View style={styles.capsRow}>
            {CAPABILITIES.map((c, i) => (
              <View key={i} style={styles.capCard}>
                <View style={styles.capIconWrap}>
                  <MaterialCommunityIcons name={c.icon} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.capTitle}>{c.title}</Text>
                <Text style={styles.capDesc}>{c.desc}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate('Models')}
            activeOpacity={0.8}
            style={{ borderRadius: DesignTokens.borderRadius.lg, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={Colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.downloadBtn}
            >
              <MaterialCommunityIcons name="download" size={18} color={Colors.onPrimary} />
              <Text style={styles.downloadBtnText}>Browse & Download Models</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.copyright}>&copy; KAVI.ai 2026</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            style={{ flex: 1 }}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />

          {modelStore.isLoadingModel && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading model...</Text>
            </View>
          )}

          {!isModelLoaded && !modelStore.isLoadingModel && hasModels && !isCloudBackend && (
            <TouchableOpacity
              style={styles.notLoadedBar}
              activeOpacity={0.7}
              onPress={async () => {
                const model = modelStore.activeModel;
                if (!model) {
                  const first = modelStore.installedModels[0];
                  if (first) {
                    modelStore.setActiveModel(first);
                    const result = await initModel(first.filePath);
                    if (!result.success) {
                      Alert.alert('Load Failed', result.errorMessage ?? 'Could not load model.');
                      modelStore.setActiveModel(null);
                    }
                  } else {
                    (navigation as any).navigate('Models');
                  }
                  return;
                }
                const result = await initModel(model.filePath);
                if (!result.success) {
                  const message = result.errorMessage ?? (isRunningInExpoGo() ? LLAMA_UNAVAILABLE_MESSAGE : 'Could not load model.');
                  Alert.alert('Load Failed', message);
                  modelStore.setActiveModel(null);
                }
              }}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.notLoadedText}>
                Tap to load {modelStore.activeModel?.displayName ?? 'a model'}
              </Text>
            </TouchableOpacity>
          )}

          <ChatInput
            onSend={handleSend}
            disabled={inputDisabled}
            placeholder={
              isGenerating
                ? 'Generating...'
                : isCloudBackend
                  ? `Message ${cloudModelId || settingsStore.app.chatBackend}`
                  : (modelStore.activeModel
                    ? `Message ${shortModelName(modelStore.activeModel.displayName)}`
                    : 'Message KaviAI')
            }
            onPlusPress={() => (navigation as any).navigate('Pals')}
            isGenerating={isGenerating}
            onStop={stopGeneration}
          />
        </KeyboardAvoidingView>
      )}
    </View>
  );
});
