import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';

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
  openai: 'robot-outline',
  anthropic: 'alpha-c-circle-outline',
  gemini: 'google',
};

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google',
};

const TIER_COLORS: Record<string, string> = {
  top: '#818CF8', // Indigo light
  mid: '#6366F1', // Indigo
  fast: '#10B981', // Success green
};

const TIER_LABELS: Record<string, string> = {
  top: 'Pro',
  mid: 'Balanced',
  fast: 'Fast',
};

interface Props {
  model: CloudModel;
  isActive: boolean;
  onSelect: (model: CloudModel) => void;
}

export default function CloudModelCard({ model, isActive, onSelect }: Props) {
  const { Colors } = useTheme();
  const tierColor = TIER_COLORS[model.tier];

  const styles = useMemo(() => StyleSheet.create({
    card: {
      borderRadius: DesignTokens.borderRadius.lg,
      borderWidth: 1,
      marginBottom: 16,
      overflow: 'hidden',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: Colors.surface,
      borderColor: Colors.border,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: DesignTokens.borderRadius.md,
      backgroundColor: Colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { 
      fontSize: 16, 
      fontWeight: '700', 
      flex: 1,
      color: Colors.onSurface,
      letterSpacing: -0.2,
    },
    tag: { 
      borderRadius: 6, 
      borderWidth: 1, 
      paddingHorizontal: 8, 
      paddingVertical: 4 
    },
    tagText: { 
      fontSize: 10, 
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
    size: { 
      fontSize: 13,
      fontWeight: '600',
      color: Colors.metaText,
    },
    meta: { 
      fontSize: 14, 
      marginBottom: 16,
      color: Colors.onSurfaceVariant,
      lineHeight: 20,
    },
    providerBadge: {
      color: Colors.primary,
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    chatBtn: {
      borderRadius: DesignTokens.borderRadius.md,
      borderWidth: 1.5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    chatText: { fontWeight: '700', fontSize: 14 },
  }), [Colors, tierColor]);

  return (
    <View style={styles.card}>
      <Text style={styles.providerBadge}>{PROVIDER_LABELS[model.provider]}</Text>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons 
              name={PROVIDER_ICONS[model.provider] as any} 
              size={20} 
              color={Colors.primary} 
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {model.displayName}
          </Text>
          <View style={[styles.tag, { backgroundColor: tierColor + '15', borderColor: tierColor + '30' }]}>
            <Text style={[styles.tagText, { color: tierColor }]}>{TIER_LABELS[model.tier]}</Text>
          </View>
        </View>
        <View style={styles.rightRow}>
          <MaterialCommunityIcons name="cloud-outline" size={14} color={Colors.metaText} />
          <Text style={styles.size}>{model.contextWindow}</Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {model.modelId} · {model.description}
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
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={isActive ? 'check-circle' : 'chat-outline'}
          size={20}
          color={isActive ? Colors.onPrimary : Colors.primary}
        />
        <Text style={[styles.chatText, { color: isActive ? Colors.onPrimary : Colors.primary }]}>
          {isActive ? 'Selected' : 'Use This Model'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
