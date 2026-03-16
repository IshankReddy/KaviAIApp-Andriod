import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CuratedModel } from '../stores/ModelStore';
import { modelStore } from '../stores/ModelStore';
import { useTheme } from '../theme/theme';

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
  const styles = useMemo(() => StyleSheet.create({
    card: { backgroundColor: Colors.surfaceVariant, borderRadius: 12, marginBottom: 12, overflow: 'hidden' as const, borderWidth: 1, borderColor: Colors.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
    nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
    name: { color: Colors.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
    tag: { backgroundColor: Colors.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    tagText: { color: Colors.onSurfaceVariant, fontSize: 10 },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    size: { color: Colors.metaText, fontSize: 12 },
    chevronBtn: { paddingLeft: 4 },
    downloadBtn: { margin: 12, marginTop: 0, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
    downloadText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    progressContainer: { margin: 12, marginTop: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressBarBg: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' as const },
    progressBarFill: { height: 6, minWidth: 2, backgroundColor: Colors.primary, borderRadius: 3 },
    progressText: { color: Colors.onSurfaceVariant, fontSize: 12, width: 36 },
    cancelBtn: { padding: 4 },
    actionRow: { margin: 12, marginTop: 0, flexDirection: 'row', gap: 8 },
    loadBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
    loadBtnActive: { backgroundColor: Colors.primary },
    loadText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    loadTextActive: { color: Colors.onPrimary },
    deleteBtn: { width: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.error, alignItems: 'center', justifyContent: 'center' },
    details: { padding: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.border },
    detailLabel: { color: Colors.metaText, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 10, marginBottom: 2 },
    detailValue: { color: Colors.onSurface, fontSize: 14 },
    metaGrid: { flexDirection: 'row', gap: 12, marginTop: 10 },
    metaCell: { flex: 1, backgroundColor: Colors.surface, borderRadius: 8, padding: 10 },
    metaLabel: { color: Colors.metaText, fontSize: 11 },
    metaValue: { color: Colors.onSurface, fontSize: 14, fontWeight: '500', marginTop: 2 },
    hfLink: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.accent, borderRadius: 8, padding: 10, justifyContent: 'center' },
    hfLinkText: { color: Colors.accent, fontSize: 13 },
  }), [Colors]);

  const installed = modelStore.installedModels.find(m => m.id === model.id);
  const isDownloading = modelStore.downloadingIds.has(model.id);
  const progress = modelStore.downloadProgress.get(model.id) ?? 0;
  const isActive = modelStore.activeModel?.id === model.id;
  const isLoaded = isActive && modelStore.isModelLoaded;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <MaterialCommunityIcons name="chat-outline" size={18} color={Colors.onSurfaceVariant} />
          <Text style={styles.name} numberOfLines={1}>{model.displayName}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{model.quantization}</Text>
          </View>
        </View>
        <View style={styles.rightRow}>
          <MaterialCommunityIcons name="database-outline" size={13} color={Colors.metaText} />
          <Text style={styles.size}> {model.sizeLabel}</Text>
          <TouchableOpacity onPress={() => setExpanded(e => !e)} style={styles.chevronBtn}>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20} color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

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
            <TouchableOpacity onPress={() => onCancelDownload(model.id)} style={styles.cancelBtn}>
              <MaterialCommunityIcons name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.downloadBtn} onPress={() => onDownload(model)}>
            <MaterialCommunityIcons name="download" size={18} color={Colors.primary} />
            <Text style={styles.downloadText}>Download</Text>
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.actionRow}>
          {isLoaded && onChat ? (
            <TouchableOpacity
              style={[styles.loadBtn, styles.loadBtnActive]}
              onPress={onChat}
            >
              <MaterialCommunityIcons name="chat-outline" size={16} color={Colors.onPrimary} />
              <Text style={[styles.loadText, styles.loadTextActive]}>Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.loadBtn, isActive && styles.loadBtnActive]}
              onPress={() => onLoad(model.id)}
              disabled={modelStore.isLoadingModel}
            >
              <MaterialCommunityIcons
                name={isActive ? 'check-circle' : 'play-circle-outline'}
                size={16} color={isActive ? Colors.onPrimary : Colors.primary}
              />
              <Text style={[styles.loadText, isActive && styles.loadTextActive]}>
                {isActive ? 'Loaded' : 'Load Model'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(model.id)}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Model Name</Text>
          <Text style={styles.detailValue}>{model.name}</Text>

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
          >
            <MaterialCommunityIcons name="open-in-new" size={14} color={Colors.accent} />
            <Text style={styles.hfLinkText}>View Model Card on Hugging Face</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default ModelCard;
