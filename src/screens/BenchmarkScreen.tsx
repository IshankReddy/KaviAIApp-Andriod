import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { modelStore } from '../stores/ModelStore';
import { generateResponse } from '../services/LlamaService';
import { chatStore } from '../stores/ChatStore';
import { useTheme, DesignTokens } from '../theme/theme';

const BENCHMARK_PROMPTS = [
  'Write a short poem about the moon.',
  'Explain the concept of recursion in programming.',
  'What are 5 benefits of regular exercise?',
  'Translate "Hello, how are you?" into French, Spanish, and German.',
  'Summarize the water cycle in three sentences.',
];

interface BenchmarkResult {
  prompt: string;
  tokensPerSec: number;
  ttftMs: number;
  msPerToken: number;
  tokenCount: number;
}

export default observer(function BenchmarkScreen() {
  const { Colors } = useTheme();
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
    content: { padding: 16, paddingBottom: 40 },
    modelBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.primary + '30',
    },
    modelBannerText: { color: Colors.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
    noModelBanner: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    noModelText: { color: Colors.metaText, fontSize: 13, fontWeight: '500' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    summaryCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    summaryValue: { color: Colors.primaryLight, fontSize: 20, fontWeight: '800' },
    summaryLabel: { color: Colors.metaText, fontSize: 10, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    runBtn: {
      backgroundColor: Colors.primary,
      borderRadius: DesignTokens.borderRadius.md,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20,
    },
    runBtnDisabled: { backgroundColor: Colors.border },
    runBtnText: { color: Colors.onPrimary, fontSize: 15, fontWeight: '700' },
    sectionLabel: {
      color: Colors.metaText,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 4,
    },
    promptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: DesignTokens.borderRadius.sm,
      marginBottom: 6,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    promptRowActive: { borderColor: Colors.primary },
    promptLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    promptText: { color: Colors.onSurface, fontSize: 13, fontWeight: '500', flex: 1 },
    resultMini: { color: Colors.primaryLight, fontSize: 12, fontWeight: '700' },
    table: {
      backgroundColor: Colors.surface,
      borderRadius: DesignTokens.borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
    tableHeader: { backgroundColor: Colors.surfaceVariant },
    tableCell: { flex: 1, padding: 10, color: Colors.onSurface, fontSize: 12, fontWeight: '500' },
    tableHeaderText: { color: Colors.metaText, fontWeight: '800', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  }), [Colors]);
  const navigation = useNavigation();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(-1);

  const handleRun = async () => {
    if (!modelStore.isModelLoaded) return;

    setRunning(true);
    setResults([]);

    if (modelStore.activeModel) {
      chatStore.createConversation(modelStore.activeModel.id);
    }

    const collected: BenchmarkResult[] = [];

    for (let i = 0; i < BENCHMARK_PROMPTS.length; i++) {
      setCurrentPromptIdx(i);
      chatStore.addUserMessage(BENCHMARK_PROMPTS[i]);
      await generateResponse('You are a helpful assistant. Be concise.');

      const messages = chatStore.messages;
      const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAI) {
        collected.push({
          prompt: BENCHMARK_PROMPTS[i],
          tokensPerSec: lastAI.tokensPerSec ?? 0,
          ttftMs: lastAI.ttftMs ?? 0,
          msPerToken: lastAI.msPerToken ?? 0,
          tokenCount: lastAI.tokenCount ?? 0,
        });
        setResults([...collected]);
      }
    }

    if (chatStore.activeConversation) {
      chatStore.deleteConversation(chatStore.activeConversation.id);
    }

    setRunning(false);
    setCurrentPromptIdx(-1);
  };

  const avgTokensPerSec = results.length > 0
    ? results.reduce((s, r) => s + r.tokensPerSec, 0) / results.length
    : 0;

  const avgTTFT = results.length > 0
    ? results.reduce((s, r) => s + r.ttftMs, 0) / results.length
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MaterialCommunityIcons name="menu" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Benchmark</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {modelStore.activeModel ? (
          <View style={styles.modelBanner}>
            <MaterialCommunityIcons name="chip" size={18} color={Colors.primary} />
            <Text style={styles.modelBannerText} numberOfLines={1}>
              {modelStore.activeModel.displayName}
            </Text>
          </View>
        ) : (
          <View style={styles.noModelBanner}>
            <Text style={styles.noModelText}>No model loaded. Load one from the Models screen.</Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{avgTokensPerSec.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>tokens/sec</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{avgTTFT.toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>avg TTFT (ms)</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{results.length}</Text>
              <Text style={styles.summaryLabel}>prompts</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.runBtn, (!modelStore.isModelLoaded || running) && styles.runBtnDisabled]}
          onPress={handleRun}
          disabled={!modelStore.isModelLoaded || running}
        >
          {running ? (
            <>
              <ActivityIndicator size="small" color={Colors.onPrimary} />
              <Text style={styles.runBtnText}>
                Running {currentPromptIdx + 1}/{BENCHMARK_PROMPTS.length}...
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="play-circle-outline" size={18} color={Colors.onPrimary} />
              <Text style={styles.runBtnText}>Run Benchmark</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Benchmark Prompts</Text>
        {BENCHMARK_PROMPTS.map((p, i) => {
          const result = results[i];
          const isCurrent = running && i === currentPromptIdx;
          return (
            <View key={i} style={[styles.promptRow, isCurrent && styles.promptRowActive]}>
              <View style={styles.promptLeft}>
                {isCurrent ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : result ? (
                  <MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} />
                ) : (
                  <MaterialCommunityIcons name="circle-outline" size={16} color={Colors.border} />
                )}
                <Text style={styles.promptText} numberOfLines={2}>{p}</Text>
              </View>
              {result && (
                <Text style={styles.resultMini}>{result.tokensPerSec.toFixed(1)} t/s</Text>
              )}
            </View>
          );
        })}

        {results.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Detailed Results</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 2 }]}>Prompt</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText]}>t/s</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText]}>TTFT</Text>
                <Text style={[styles.tableCell, styles.tableHeaderText]}>Tokens</Text>
              </View>
              {results.map((r, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {r.prompt.slice(0, 24)}...
                  </Text>
                  <Text style={styles.tableCell}>{r.tokensPerSec.toFixed(1)}</Text>
                  <Text style={styles.tableCell}>{r.ttftMs}ms</Text>
                  <Text style={styles.tableCell}>{r.tokenCount}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
});
