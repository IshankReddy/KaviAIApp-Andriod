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
import { generateResponse, stopGeneration } from '../services/LlamaService';
import { generateCloudResponse } from '../services/CloudChatService';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { useTheme } from '../theme/theme';

const LOGO = require('../../assets/logo.png');

/** e.g. "Qwen2.5-1.5B-Instruct" -> "Qwen", "DeepSeek-R1-Distill" -> "DeepSeek". */
function shortModelName(displayName: string): string {
  const match = displayName.match(/^([A-Za-z]+)/);
  return match ? match[1] : displayName.slice(0, 12);
}

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
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingTop: Platform.OS === 'ios' ? 50 : 12,
      paddingBottom: 10,
      paddingHorizontal: 8,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { color: Colors.onSurface, fontSize: 16, fontWeight: '600' },
    headerSubtitle: { color: Colors.metaText, fontSize: 12, marginTop: 1 },
    headerActions: { flexDirection: 'row' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    logoWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      overflow: 'hidden' as const,
    },
    logo: { width: 88, height: 88 },
    emptyTitle: { color: Colors.onSurface, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    emptySubtitle: { color: Colors.metaText, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    downloadBtn: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 24,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    downloadBtnText: { color: Colors.onSurface, fontSize: 15, fontWeight: '500' },
    chatArea: { flex: 1 },
    messageList: { paddingVertical: 8, paddingBottom: 4 },
    loadingBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 8,
      backgroundColor: Colors.surfaceVariant,
    },
    loadingText: { color: Colors.onSurfaceVariant, fontSize: 13 },
    notLoadedBar: {
      backgroundColor: Colors.surfaceVariant,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    notLoadedText: { color: Colors.metaText, fontSize: 13 },
  }), [Colors]);

  const hasModels = modelStore.hasModels;
  const isModelLoaded = modelStore.isModelLoaded;
  const isGenerating = chatStore.isGenerating;
  const messages = chatStore.messages;
  const activeConv = chatStore.activeConversation;

  // Auto-scroll on new tokens
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length, chatStore.streamingContent]);

  // Create a conversation if none exists and model is loaded
  useEffect(() => {
    if (isModelLoaded && modelStore.activeModel && !activeConv) {
      chatStore.createConversation(modelStore.activeModel.id);
    }
  }, [isModelLoaded, modelStore.activeModel]);

  const handleSend = async (text: string) => {
    const backend = settingsStore.app.chatBackend;
    const needsLocal = backend === 'local';
    if (needsLocal && !isModelLoaded) return;
    chatStore.addUserMessage(text);
    const activePal = activeConv?.palId ? palStore.getPal(activeConv.palId) : null;
    const systemPrompt = activePal?.systemPrompt ?? 'You are a helpful AI assistant.';
    if (backend === 'local') {
      await generateResponse(systemPrompt);
      return;
    }

    chatStore.startAssistantMessage();
    try {
      const reply = await generateCloudResponse(systemPrompt, chatStore.messages);
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

  const headerSubtitle =
    settingsStore.app.chatBackend === 'local'
      ? (modelStore.activeModel?.displayName ?? '')
      : `Cloud: ${settingsStore.app.chatBackend}`;

  const inputDisabled = settingsStore.app.chatBackend === 'local'
    ? (!isModelLoaded || isGenerating)
    : isGenerating;

  const handleChatMenu = () => {
    if (activeConv) {
      Alert.alert('Chat', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Chat',
          onPress: () => {
            if (modelStore.activeModel) {
              chatStore.createConversation(modelStore.activeModel.id);
            }
          },
        },
        {
          text: 'Clear Conversation',
          style: 'destructive',
          onPress: () => {
            if (activeConv) {
              chatStore.deleteConversation(activeConv.id);
              if (modelStore.activeModel) {
                chatStore.createConversation(modelStore.activeModel.id);
              }
            }
          },
        },
      ]);
    } else {
      if (modelStore.activeModel) {
        chatStore.createConversation(modelStore.activeModel.id);
      }
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
          <MaterialCommunityIcons name="menu" size={24} color={Colors.onSurface} />
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
              if (modelStore.activeModel) {
                chatStore.createConversation(modelStore.activeModel.id);
              }
            }}
          >
            <MaterialCommunityIcons name="square-edit-outline" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleChatMenu}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty state — no models installed */}
      {!hasModels ? (
        <View style={styles.emptyState}>
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.emptyTitle}>No Models Available</Text>
          <Text style={styles.emptySubtitle}>
            Download a model to start chatting with KaviAI
          </Text>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => (navigation as any).navigate('Models')}
          >
            <Text style={styles.downloadBtnText}>Download Model</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Chat area */
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
          />

          {/* Loading model indicator */}
          {modelStore.isLoadingModel && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading model...</Text>
            </View>
          )}

          {/* Model not loaded bar */}
          {!isModelLoaded && !modelStore.isLoadingModel && hasModels && (
            <View style={styles.notLoadedBar}>
              <Text style={styles.notLoadedText}>
                Model not loaded. Please initialize the model.
              </Text>
            </View>
          )}

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            disabled={inputDisabled}
            placeholder={
              isGenerating
                ? 'Generating...'
                : settingsStore.app.chatBackend === 'local'
                  ? (modelStore.activeModel
                    ? `Message ${shortModelName(modelStore.activeModel.displayName)}`
                    : 'Message KaviAI')
                  : `Message ${settingsStore.app.chatBackend}`
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
