import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  Platform, Modal, TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { modelStore, CURATED_MODELS, CuratedModel, ModelSortOption, parametersToB } from '../stores/ModelStore';
import { downloadModel, cancelDownload, deleteModelFile } from '../services/DownloadService';
import { initModel, releaseModel, isRunningInExpoGo, LLAMA_UNAVAILABLE_MESSAGE } from '../services/LlamaService';
import { searchGGUFModels, getGGUFFiles } from '../services/HuggingFaceService';
import ModelCard from '../components/ModelCard';
import RangeSlider from '../components/RangeSlider';
import { useTheme } from '../theme/theme';

const PARAM_SLIDER_MIN = 0;
const PARAM_SLIDER_STEP = 0.1;

export default observer(function ModelsScreen() {
  const navigation = useNavigation();
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [ggufFiles, setGgufFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [availableSectionCollapsed, setAvailableSectionCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<ModelSortOption>('sizeAsc');
  const [nameSearch, setNameSearch] = useState('');
  const [paramMinB, setParamMinB] = useState(PARAM_SLIDER_MIN);
  const [paramMaxB, setParamMaxB] = useState(5);

  const maxParamB = useMemo(() => {
    const fromCurated = Math.max(0, ...CURATED_MODELS.map((m) => parametersToB(m.parameters)));
    const fromInstalled = modelStore.installedModels.length
      ? Math.max(0, ...modelStore.installedModels.map((m) => parametersToB(m.parameters)))
      : 0;
    return Math.max(0.5, fromCurated, fromInstalled);
  }, [modelStore.installedModels]);

  useEffect(() => {
    setParamMaxB((prev) => Math.min(prev, maxParamB));
    setParamMinB((prev) => Math.min(prev, maxParamB));
  }, [maxParamB]);

  const { Colors } = useTheme();
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
    content: { padding: 16, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    sectionTitle: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
    sectionHint: { color: Colors.metaText, fontSize: 12, marginBottom: 12 },
    nameSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    nameSearchInput: { flex: 1, paddingVertical: 10, color: Colors.onSurface, fontSize: 14 },
    sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sortLabel: { color: Colors.onSurfaceVariant, fontSize: 13, fontWeight: '500' },
    sortButtons: { flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' },
    sortBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: Colors.surfaceVariant,
    },
    sortBtnActive: { backgroundColor: Colors.primary },
    sortBtnText: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '500' },
    sortBtnTextActive: { color: Colors.onPrimary },
    paramRangeBox: {
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    paramRangeTitle: { color: Colors.onSurface, fontSize: 13, fontWeight: '600', marginBottom: 12 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    modal: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 42 : 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      marginBottom: 12,
    },
    modalTitle: { color: Colors.onSurface, fontSize: 17, fontWeight: '600' },
    searchBar: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    searchInput: {
      flex: 1,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: Colors.onSurface,
      fontSize: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchBtn: { width: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    resultItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    resultName: { color: Colors.onSurface, fontSize: 13, flex: 1 },
    resultMeta: { color: Colors.metaText, fontSize: 12 },
    repoLabel: { color: Colors.metaText, fontSize: 12, marginBottom: 12 },
    emptyHint: { color: Colors.metaText, textAlign: 'center', marginTop: 40, fontSize: 14 },
  }), [Colors]);

  const handleDownload = useCallback(async (model: CuratedModel) => {
    await downloadModel(model, () => {});
  }, []);

  const handleCancelDownload = useCallback(async (modelId: string) => {
    await cancelDownload(modelId);
  }, []);

  const handleLoad = useCallback(async (modelId: string) => {
    const model = modelStore.installedModels.find(m => m.id === modelId);
    if (!model) return;
    if (modelStore.activeModel?.id === modelId) return;

    modelStore.setActiveModel(model);
    const result = await initModel(model.filePath);
    if (!result.success) {
      const message = result.errorMessage ?? (isRunningInExpoGo() ? LLAMA_UNAVAILABLE_MESSAGE : 'Could not initialize the model. Check available memory or use a development build.');
      Alert.alert('Load Failed', message);
      modelStore.setActiveModel(null);
    }
  }, []);

  const handleDelete = useCallback((modelId: string) => {
    const model = modelStore.installedModels.find(m => m.id === modelId);
    if (!model) return;
    Alert.alert('Delete Model', `Delete "${model.displayName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (modelStore.activeModel?.id === modelId) await releaseModel();
          await deleteModelFile(model);
        },
      },
    ]);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchGGUFModels(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSelectRepo = async (repoId: string) => {
    setSelectedRepo(repoId);
    setLoadingFiles(true);
    const files = await getGGUFFiles(repoId);
    setGgufFiles(files);
    setLoadingFiles(false);
  };

  const filterAndSortModels = useCallback((list: CuratedModel[]) => {
    const q = nameSearch.trim().toLowerCase();
    const filtered = list.filter((m) => {
      const b = parametersToB(m.parameters);
      if (b < paramMinB || b > paramMaxB) return false;
      if (q) {
        const name = (m.displayName + ' ' + m.name + ' ' + m.author).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'sizeAsc') return a.sizeBytes - b.sizeBytes;
      return b.sizeBytes - a.sizeBytes;
    });
    return sorted;
  }, [sortBy, nameSearch, paramMinB, paramMaxB]);

  const allAvailableModels = useMemo(
    () => filterAndSortModels(CURATED_MODELS),
    [filterAndSortModels],
  );

  /** Installed models as CuratedModel[] for display (shown at top). */
  const installedForDisplay = useMemo((): CuratedModel[] => {
    return modelStore.installedModels.map((m) => ({
      id: m.id,
      displayName: m.displayName,
      name: m.name,
      quantization: m.quantization,
      sizeLabel: m.sizeLabel,
      sizeBytes: m.sizeBytes,
      capabilities: m.capabilities,
      parameters: m.parameters,
      author: m.author,
      hfRepoId: m.hfRepoId,
      hfUrl: m.hfUrl,
      downloadUrl: '',
    }));
  }, [modelStore.installedModels]);

  /** Available to download = curated models not already installed. */
  const availableModels = useMemo(
    () => allAvailableModels.filter(
      (m) => !modelStore.installedModels.some((i) => i.id === m.id),
    ),
    [allAvailableModels, modelStore.installedModels],
  );

  /** Single list: installed first (at top), then available to download. */
  const modelsList = useMemo(
    () => [...installedForDisplay, ...availableModels],
    [installedForDisplay, availableModels],
  );

  const handleChat = useCallback(() => {
    (navigation as any).navigate('Chat');
  }, [navigation]);

  const handleAddCustomModel = async (file: any, repoId: string) => {
    const parts = repoId.split('/');
    const id = repoId.replace('/', '-') + '-' + file.filename.replace('.gguf', '');
    const custom: CuratedModel = {
      id,
      displayName: file.filename.replace('.gguf', ''),
      name: file.filename,
      quantization: extractQuantization(file.filename),
      sizeLabel: file.sizeLabel,
      sizeBytes: file.size,
      capabilities: ['Chat'],
      parameters: 'Unknown',
      author: parts[0] ?? '',
      hfRepoId: repoId,
      hfUrl: 'https://huggingface.co/' + repoId,
      downloadUrl: file.downloadUrl,
    };
    setSearchModal(false);
    setSelectedRepo(null);
    await downloadModel(custom, () => {});
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
        <Text style={styles.headerTitle}>Models</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => (navigation as any).navigate('Settings')}>
          <MaterialCommunityIcons name="tune" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Models: installed at top, then available to download */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Models</Text>
          <TouchableOpacity onPress={() => setAvailableSectionCollapsed(c => !c)}>
            <MaterialCommunityIcons
              name={availableSectionCollapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
        {!availableSectionCollapsed && (
          <>
            <Text style={styles.sectionHint}>Your models at top. Use + to find more.</Text>
            {/* Name search */}
            <View style={styles.nameSearchRow}>
              <MaterialCommunityIcons name="magnify" size={20} color={Colors.metaText} />
              <TextInput
                style={styles.nameSearchInput}
                value={nameSearch}
                onChangeText={setNameSearch}
                placeholder="Search by name..."
                placeholderTextColor={Colors.metaText}
                returnKeyType="search"
              />
              {nameSearch.length > 0 && (
                <TouchableOpacity onPress={() => setNameSearch('')} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={Colors.metaText} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort:</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'sizeAsc' && styles.sortBtnActive]}
                  onPress={() => setSortBy('sizeAsc')}
                >
                  <MaterialCommunityIcons
                    name="arrow-up"
                    size={16}
                    color={sortBy === 'sizeAsc' ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.sortBtnText, sortBy === 'sizeAsc' && styles.sortBtnTextActive]}>Size ↑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'sizeDesc' && styles.sortBtnActive]}
                  onPress={() => setSortBy('sizeDesc')}
                >
                  <MaterialCommunityIcons
                    name="arrow-down"
                    size={16}
                    color={sortBy === 'sizeDesc' ? Colors.onPrimary : Colors.onSurfaceVariant}
                  />
                  <Text style={[styles.sortBtnText, sortBy === 'sizeDesc' && styles.sortBtnTextActive]}>Size ↓</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Parameter range: 0 to max model params */}
            <View style={styles.paramRangeBox}>
              <Text style={styles.paramRangeTitle}>Parameter range (0 – {maxParamB.toFixed(1)}B)</Text>
              <RangeSlider
                minValue={paramMinB}
                maxValue={Math.min(paramMaxB, maxParamB)}
                rangeMin={PARAM_SLIDER_MIN}
                rangeMax={maxParamB}
                step={PARAM_SLIDER_STEP}
                decimals={1}
                onValueChange={(low, high) => {
                  setParamMinB(low);
                  setParamMaxB(high);
                }}
              />
            </View>

            {modelsList.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onDownload={handleDownload}
                onCancelDownload={handleCancelDownload}
                onLoad={handleLoad}
                onDelete={handleDelete}
                onChat={handleChat}
              />
            ))}

            <View style={{ marginBottom: 8 }} />
          </>
        )}
      </ScrollView>

      {/* FAB – search Hugging Face */}
      <TouchableOpacity style={styles.fab} onPress={() => setSearchModal(true)}>
        <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
      </TouchableOpacity>

      {/* HF Search Modal */}
      <Modal visible={searchModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedRepo ? 'Select GGUF File' : 'Search Hugging Face'}
            </Text>
            <TouchableOpacity onPress={() => {
              if (selectedRepo) { setSelectedRepo(null); setGgufFiles([]); }
              else setSearchModal(false);
            }}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>

          {!selectedRepo ? (
            <>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search models (e.g., llama, mistral...)"
                  placeholderTextColor={Colors.metaText}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  {searching
                    ? <ActivityIndicator size="small" color={Colors.onPrimary} />
                    : <MaterialCommunityIcons name="magnify" size={20} color={Colors.onPrimary} />}
                </TouchableOpacity>
              </View>

              <FlatList
                data={searchResults}
                keyExtractor={item => item.modelId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectRepo(item.modelId)}
                  >
                    <Text style={styles.resultName}>{item.modelId}</Text>
                    <Text style={styles.resultMeta}>
                      ⬇ {(item.downloads / 1000).toFixed(0)}k  ♥ {item.likes}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !searching ? (
                    <Text style={styles.emptyHint}>Search for GGUF models above</Text>
                  ) : null
                }
              />
            </>
          ) : (
            <>
              <Text style={styles.repoLabel}>{selectedRepo}</Text>
              {loadingFiles ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={ggufFiles}
                  keyExtractor={f => f.filename}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.resultItem}
                      onPress={() => handleAddCustomModel(item, selectedRepo)}
                    >
                      <Text style={styles.resultName}>{item.filename}</Text>
                      <Text style={styles.resultMeta}>{item.sizeLabel}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyHint}>No GGUF files found in this repo</Text>
                  }
                />
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
});

function extractQuantization(filename: string): string {
  const match = filename.match(/Q\d+_?\w*/i);
  return match ? match[0].toUpperCase() : 'GGUF';
}
