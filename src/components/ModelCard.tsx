import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Platform, ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CuratedModel } from '../stores/ModelStore';
import { modelStore } from '../stores/ModelStore';
import { useTheme, DesignTokens } from '../theme/theme';
import { compatibilityLabel, compatibilityIcon } from '../utils/DeviceInfo';

interface Props {
  model: CuratedModel;
  onDownload: (model: CuratedModel) => void;
  onCancelDownload: (modelId: string) => void;
  onLoad: (modelId: string) => void;
  onDelete: (modelId: string) => void;
  /** When model is loaded, Chat button calls this to open the chat screen. */
  onChat?: () => void;
}

const ModelCard = observer(function ModelCard({
  model, onDownload, onCancelDownload, onLoad, onDelete, onChat,
}: Props) {
  const { Colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const compat = modelStore.getCompatibility(model.sizeBytes);
  const compatText = compatibilityLabel(compat);
  const compatIconName = compatibilityIcon(compat);
  const compatColor = compat === 'recommended' ? Colors.success
    : compat === 'compatible' ? '#F59E0B'
    : Colors.error;
  
  const styles = useMemo(() => StyleSheet.create({
    card: { 
      backgroundColor: Colors.surface, 
      borderRadius: DesignTokens.borderRadius.lg, 
      marginBottom: 16, 
      borderWidth: 1.5, 
      borderColor: Colors.border,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 16, 
      paddingTop: 18, 
      paddingBottom: 14 
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: DesignTokens.borderRadius.md,
      backgroundColor: Colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    name: { 
      color: Colors.onSurface, 
      fontSize: 16, 
      fontWeight: '800', 
      flex: 1,
      letterSpacing: -0.3,
    },
    tag: { 
      backgroundColor: Colors.primary + '18', 
      borderRadius: 8, 
      paddingHorizontal: 10, 
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: Colors.primary + '30',
    },
    tagText: { 
      color: Colors.primary, 
      fontSize: 10, 
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    size: { 
      color: Colors.metaText, 
      fontSize: 13,
      fontWeight: '700',
    },
    chevronBtn: { padding: 4 },
    
    downloadBtn: { 
      margin: 16, 
      marginTop: 4, 
      backgroundColor: Colors.primary, 
      borderRadius: DesignTokens.borderRadius.md, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 14, 
      gap: 10,
      ...Platform.select({
        ios: {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    downloadText: { color: Colors.onPrimary, fontWeight: '800', fontSize: 15 },
    
    progressContainer: { 
      margin: 16, 
      marginTop: 4, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 12,
      backgroundColor: Colors.surfaceVariant,
      padding: 14,
      borderRadius: DesignTokens.borderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    progressBarBg: { 
      flex: 1, 
      height: 8, 
      backgroundColor: Colors.border, 
      borderRadius: 4, 
      overflow: 'hidden' as const 
    },
    progressBarFill: { 
      height: 8, 
      backgroundColor: Colors.primary, 
      borderRadius: 4 
    },
    progressText: { 
      color: Colors.onSurfaceVariant, 
      fontSize: 13, 
      fontWeight: '800',
      width: 40,
      textAlign: 'right',
    },
    
    actionRow: { margin: 16, marginTop: 4, flexDirection: 'row', gap: 10 },
    loadBtn: { 
      flex: 1, 
      backgroundColor: Colors.surface, 
      borderRadius: DesignTokens.borderRadius.md, 
      borderWidth: 1.5, 
      borderColor: Colors.primary, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      paddingVertical: 14, 
      gap: 8 
    },
    loadBtnActive: { 
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    loadText: { color: Colors.primary, fontWeight: '800', fontSize: 15 },
    loadTextActive: { color: Colors.onPrimary },
    
    deleteBtn: { 
      width: 52, 
      borderRadius: DesignTokens.borderRadius.md, 
      backgroundColor: Colors.error + '12',
      borderWidth: 1.5, 
      borderColor: Colors.error + '30', 
      alignItems: 'center', 
      justifyContent: 'center' 
    },
    
    details: { 
      padding: 16, 
      paddingTop: 12, 
      borderTopWidth: 1.5, 
      borderTopColor: Colors.border,
      marginTop: 4,
      backgroundColor: Colors.background,
    },
    detailLabel: { 
      color: Colors.metaText, 
      fontSize: 11, 
      fontWeight: '800', 
      textTransform: 'uppercase', 
      marginTop: 16, 
      marginBottom: 6,
      letterSpacing: 0.8,
    },
    detailValue: { 
      color: Colors.onSurface, 
      fontSize: 15,
      fontWeight: '600',
    },
    metaGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
    metaCell: { 
      flex: 1, 
      backgroundColor: Colors.surface, 
      borderRadius: DesignTokens.borderRadius.md, 
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    metaLabel: { 
      color: Colors.metaText, 
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    metaValue: { 
      color: Colors.onSurface, 
      fontSize: 15, 
      fontWeight: '700' 
    },
    hfLink: { 
      marginTop: 20, 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8, 
      borderWidth: 1.5, 
      borderColor: Colors.accent, 
      borderRadius: DesignTokens.borderRadius.md, 
      padding: 14, 
      justifyContent: 'center',
      backgroundColor: Colors.accent + '08',
    },
    hfLinkText: { 
      color: Colors.accent, 
      fontSize: 14, 
      fontWeight: '800' 
    },
  }), [Colors]);

  const installed = modelStore.installedModels.find(m => m.id === model.id);
  const isDownloading = modelStore.downloadingIds.has(model.id);
  const progress = modelStore.downloadProgress.get(model.id) ?? 0;
  const isActive = modelStore.activeModel?.id === model.id;
  const isLoaded = isActive && modelStore.isModelLoaded;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
      >
        <View style={styles.nameRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons 
              name={installed ? "check-decagram" : "download-outline"} 
              size={22} 
              color={installed ? Colors.success : Colors.primary} 
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{model.displayName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{model.quantization}</Text>
              </View>
              <Text style={styles.size}>{model.sizeLabel}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                <MaterialCommunityIcons name={compatIconName as any} size={14} color={compatColor} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: compatColor }}>{compatText}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.rightRow}>
          <View style={styles.chevronBtn}>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={24} color={Colors.onSurfaceVariant}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Download / status button */}
      {!installed ? (
        isDownloading ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(0, progress))}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.min(100, Math.max(0, progress))}%</Text>
            <TouchableOpacity onPress={() => onCancelDownload(model.id)} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => onDownload(model)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cloud-download-outline" size={20} color={Colors.onPrimary} />
              <Text style={styles.downloadText}>Download Model</Text>
            </TouchableOpacity>
            {/* Download size & WiFi info */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              marginHorizontal: 16, marginBottom: 12, marginTop: -4,
              paddingHorizontal: 4,
            }}>
              <MaterialCommunityIcons name="information-outline" size={14} color={Colors.metaText} />
              <Text style={{ color: Colors.metaText, fontSize: 12, fontWeight: '500', flex: 1 }}>
                {model.sizeLabel} download · Use Wi-Fi to save mobile data
              </Text>
            </View>
          </View>
        )
      ) : (
        <View style={styles.actionRow}>
          {isLoaded && onChat ? (
            <TouchableOpacity
              style={[styles.loadBtn, styles.loadBtnActive]}
              onPress={onChat}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="chat-outline" size={20} color={Colors.onPrimary} />
              <Text style={[styles.loadText, styles.loadTextActive]}>Start Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.loadBtn, isActive && styles.loadBtnActive]}
              onPress={() => onLoad(model.id)}
              disabled={modelStore.isLoadingModel}
              activeOpacity={0.8}
            >
              {modelStore.isLoadingModel && isActive ? (
                <ActivityIndicator size="small" color={Colors.onPrimary} />
              ) : (
                <MaterialCommunityIcons
                  name={isActive ? 'check-circle' : 'play-circle-outline'}
                  size={20} color={isActive ? Colors.onPrimary : Colors.primary}
                />
              )}
              <Text style={[styles.loadText, isActive && styles.loadTextActive]}>
                {isActive ? 'Active' : 'Load To Memory'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(model.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Hugging Face Repository</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{model.hfRepoId}</Text>

          <Text style={styles.detailLabel}>Capabilities</Text>
          <Text style={styles.detailValue}>{model.capabilities.join(', ')}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Parameters</Text>
              <Text style={styles.metaValue}>{model.parameters}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Author</Text>
              <Text style={styles.metaValue}>{model.author}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.hfLink}
            onPress={() => Linking.openURL(model.hfUrl)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="open-in-new" size={16} color={Colors.accent} />
            <Text style={styles.hfLinkText}>Hugging Face Card</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default ModelCard;
