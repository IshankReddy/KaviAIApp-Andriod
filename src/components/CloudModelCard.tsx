import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

export interface CloudModel {
  id: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  displayName: string;
  modelId: string;
  description: string;
  contextWindow: string;
  tier: 'top' | 'mid' | 'fast';
}

const PROVIDER_ICONS: Record<string, string> = {
  openai: 'robot',
  anthropic: 'alpha-c-circle',
  gemini: 'google',
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google',
};

const TIER_COLORS: Record<string, string> = {
  top: '#7c3aed',
  mid: '#2563eb',
  fast: '#059669',
};

const TIER_LABELS: Record<string, string> = {
  top: 'Most Capable',
  mid: 'Balanced',
  fast: 'Fast & Cheap',
};

interface Props {
  model: CloudModel;
  isActive: boolean;
  onSelect: (model: CloudModel) => void;
}

export default function CloudModelCard({ model, isActive, onSelect }: Props) {
  const { Colors } = useTheme();
  const tierColor = TIER_COLORS[model.tier];

  return (
    <View style={[styles.card, { backgroundColor: Colors.surfaceVariant, borderColor: Colors.border }]}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <MaterialCommunityIcons name={PROVIDER_ICONS[model.provider] as any} size={18} color={Colors.onSurfaceVariant} />
          <Text style={[styles.name, { color: Colors.onSurface }]} numberOfLines={1}>
            {model.displayName}
          </Text>
          <View style={[styles.tag, { backgroundColor: tierColor + '22', borderColor: tierColor + '55' }]}>
            <Text style={[styles.tagText, { color: tierColor }]}>{TIER_LABELS[model.tier]}</Text>
          </View>
        </View>
        <View style={styles.rightRow}>
          <MaterialCommunityIcons name="cloud-outline" size={13} color={Colors.metaText} />
          <Text style={[styles.size, { color: Colors.metaText }]}>{model.contextWindow}</Text>
        </View>
      </View>

      <Text style={[styles.meta, { color: Colors.metaText }]}>
        {PROVIDER_LABELS[model.provider]} · {model.modelId} · {model.description}
      </Text>

      <TouchableOpacity
        style={[
          styles.chatBtn,
          {
            borderColor: Colors.primary,
            backgroundColor: isActive ? Colors.primary : Colors.surface,
          },
        ]}
        onPress={() => onSelect(model)}
      >
        <MaterialCommunityIcons
          name={isActive ? 'check-circle' : 'chat-outline'}
          size={18}
          color={isActive ? Colors.onPrimary : Colors.primary}
        />
        <Text style={[styles.chatText, { color: isActive ? Colors.onPrimary : Colors.primary }]}>
          {isActive ? 'Selected' : 'Chat'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  name: { fontSize: 14, fontWeight: '600', flex: 1 },
  tag: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '600' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8 },
  size: { fontSize: 12 },
  meta: { fontSize: 12, marginBottom: 10 },
  chatBtn: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  chatText: { fontWeight: '600', fontSize: 14 },
});
