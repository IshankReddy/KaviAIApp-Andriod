import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  Platform, Modal, TextInput, FlatList, ActivityIndicator, Dimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { modelStore, CURATED_MODELS, CuratedModel, ModelSortOption, ModelCategory, parametersToB } from '../stores/ModelStore';
import { downloadModel, cancelDownload, deleteModelFile } from '../services/DownloadService';
import { initModel, releaseModel, isRunningInExpoGo, LLAMA_UNAVAILABLE_MESSAGE } from '../services/LlamaService';
import { searchGGUFModels, getGGUFFiles } from '../services/HuggingFaceService';
import ModelCard from '../components/ModelCard';
import CloudModelCard, { CloudModel } from '../components/CloudModelCard';
import RangeSlider from '../components/RangeSlider';
import { useTheme, DesignTokens } from '../theme/theme';
import { secretsStore } from '../stores/SecretsStore';
import { settingsStore } from '../stores/SettingsStore';
import { LinearGradient } from 'expo-linear-gradient';

const ALL_CLOUD_MODELS: CloudModel[] = [
  { id: 'openai-gpt-4.1',      provider: 'openai',    modelId: 'gpt-4.1',      displayName: 'GPT-4.1',            description: '1M context',   contextWindow: '1M',   tier: 'mid' },
  { id: 'openai-gpt-4.1-mini', provider: 'openai',    modelId: 'gpt-4.1-mini', displayName: 'GPT-4.1 mini',       description: 'Fast & cheap', contextWindow: '1M',   tier: 'fast' },
  { id: 'openai-o3',           provider: 'openai',    modelId: 'o3',            displayName: 'o3',                 description: 'Best reasoning',contextWindow: '200K', tier: 'top' },
  { id: 'openai-o4-mini',      provider: 'openai',    modelId: 'o4-mini',       displayName: 'o4-mini',            description: 'Fast reasoning',contextWindow: '200K', tier: 'mid' },
  { id: 'anthropic-sonnet-4-6', provider: 'anthropic', modelId: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', description: 'Speed + intelligence', contextWindow: '1M', tier: 'mid' },
  { id: 'anthropic-opus-4-6',   provider: 'anthropic', modelId: 'claude-opus-4-6',   displayName: 'Claude Opus 4.6',   description: 'Most intelligent',     contextWindow: '1M', tier: 'top' },
  { id: 'anthropic-haiku-4-5',  provider: 'anthropic', modelId: 'claude-haiku-4-5',  displayName: 'Claude Haiku 4.5',  description: 'Fastest / cheapest',   contextWindow: '200K', tier: 'fast' },
  { id: 'gemini-2.5-flash',      provider: 'gemini',    modelId: 'gemini-2.5-flash',      displayName: 'Gemini 2.5 Flash',      description: 'Best price-perf',  contextWindow: '1M', tier: 'mid' },
  { id: 'gemini-2.5-flash-lite', provider: 'gemini',    modelId: 'gemini-2.5-flash-lite',  displayName: 'Gemini 2.5 Flash-Lite', description: 'Fastest / cheapest', contextWindow: '1M', tier: 'fast' },
  { id: 'gemini-2.5-pro',        provider: 'gemini',    modelId: 'gemini-2.5-pro',         displayName: 'Gemini 2.5 Pro',        description: 'Most capable',     contextWindow: '1M', tier: 'top' },
];

const PARAM_SLIDER_MIN = 0;
const PARAM_SLIDER_STEP = 0.1;

interface CategoryDef {
  key: ModelCategory;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

const CATEGORIES: CategoryDef[] = [
  { key: 'coding',    label: 'Coding',         icon: 'code-braces',             color: '#6366F1', desc: 'Write & debug code' },
  { key: 'chat',      label: 'Chat',           icon: 'chat-processing-outline', color: '#8B5CF6', desc: 'General conversation' },
  { key: 'reasoning', label: 'Reasoning',      icon: 'brain',                   color: '#EC4899', desc: 'Logic & math' },
  { key: 'image',     label: 'Image',          icon: 'image-outline',           color: '#F59E0B', desc: 'Vision & generation' },
  { key: 'audio',     label: 'Audio',          icon: 'waveform',                color: '#10B981', desc: 'Speech & sound' },
  { key: 'health',    label: 'Health',         icon: 'heart-pulse',             color: '#EF4444', desc: 'Medical & wellness' },
  { key: 'news',      label: 'News',           icon: 'newspaper-variant-outline', color: '#0EA5E9', desc: 'Summaries & digest' },
  { key: 'video',     label: 'Video',          icon: 'play-circle-outline',     color: '#F97316', desc: 'Video understanding' },
];

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PAD = 16;
const TILE_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;

export default observer(function ModelsScreen() {
  const navigation = useNavigation();
  const [searchModal, setSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [ggufFiles, setGgufFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  type FilterKey = 'models' | 'ondevice' | 'claude' | 'chatgpt' | 'gemini';
  const [activeFilter, setActiveFilter] = useState<FilterKey>('models');
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory | null>(null);

  const [sortBy, setSortBy] = useState<ModelSortOption>('sizeAsc');
  const [nameSearch, setNameSearch] = useState('');
  const [paramMinB, setParamMinB] = useState(PARAM_SLIDER_MIN);
  const [paramMaxB, setParamMaxB] = useState(5);
  const [showFilters, setShowFilters] = useState(false);

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
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
      paddingBottom: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      zIndex: 10,
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: DesignTokens.borderRadius.sm },
    headerTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    content: { paddingHorizontal: GRID_PAD, paddingBottom: 100 },

    filterBar: { flexDirection: 'row', marginBottom: 16 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { color: Colors.onSurfaceVariant, fontSize: 13, fontWeight: '600' },
    filterChipTextActive: { color: Colors.onPrimary, fontWeight: '700' },

    // Category grid
    gridRow: { flexDirection: 'row', gap: GRID_GAP, marginBottom: GRID_GAP },
    tile: {
      width: TILE_W,
      height: TILE_W * 0.72,
      borderRadius: 16,
      padding: 14,
      justifyContent: 'space-between',
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
        android: { elevation: 4 },
      }),
    },
    tileIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    tileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    tileCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },
    tileName: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    tileDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', marginTop: 2 },

    // Category detail header
    catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    catBackBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    catTitle: { color: Colors.onSurface, fontSize: 20, fontWeight: '900', letterSpacing: -0.5, flex: 1 },

    // Search / sort / filter for list views
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 44, marginBottom: 10 },
    searchInput: { flex: 1, color: Colors.onSurface, fontSize: 14, fontWeight: '600' },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sortChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    sortChipText: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
    sortChipTextActive: { color: Colors.onPrimary },
    filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginLeft: 'auto' },
    filterToggleActive: { borderColor: Colors.primary },
    filterToggleText: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700' },
    paramBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
    paramTitle: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700', marginBottom: 12 },

    // Device row
    deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
    deviceText: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '600', flex: 1 },

    // Installed section
    installedTitle: { color: Colors.onSurface, fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4 },

    fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
      ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 }, android: { elevation: 8 } }) },
    fabGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

    modal: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 42 : 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
    modalTitle: { color: Colors.onSurface, fontSize: 17, fontWeight: '700' },
    searchBar: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    modalSearchInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: Colors.onSurface, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
    searchBtn: { width: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
    resultName: { color: Colors.onSurface, fontSize: 14, fontWeight: '600', flex: 1 },
    resultMeta: { color: Colors.metaText, fontSize: 12, fontWeight: '500' },
    repoLabel: { color: Colors.primary, fontSize: 13, fontWeight: '700', marginBottom: 12 },
    emptyHint: { color: Colors.metaText, textAlign: 'center', marginTop: 60, fontSize: 14, fontWeight: '500' },
    emptyCard: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' as const, padding: 24, marginTop: 8, alignItems: 'center', gap: 10 },
    emptyCardText: { color: Colors.onSurfaceVariant, fontSize: 13, textAlign: 'center', fontWeight: '600', lineHeight: 19 },
  }), [Colors]);

  // ---- Handlers ----
  const handleDownload = useCallback(async (model: CuratedModel) => { await downloadModel(model, () => {}); }, []);
  const handleCancelDownload = useCallback(async (modelId: string) => { await cancelDownload(modelId); }, []);
  const handleLoad = useCallback(async (modelId: string) => {
    const model = modelStore.installedModels.find(m => m.id === modelId);
    if (!model || modelStore.activeModel?.id === modelId) return;
    modelStore.setActiveModel(model);
    const result = await initModel(model.filePath);
    if (!result.success) {
      Alert.alert('Load Failed', result.errorMessage ?? (isRunningInExpoGo() ? LLAMA_UNAVAILABLE_MESSAGE : 'Could not initialize the model.'));
      modelStore.setActiveModel(null);
    }
  }, []);
  const handleDelete = useCallback((modelId: string) => {
    const model = modelStore.installedModels.find(m => m.id === modelId);
    if (!model) return;
    Alert.alert('Delete Model', `Delete "${model.displayName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        if (modelStore.activeModel?.id === modelId) await releaseModel();
        await deleteModelFile(model);
      }},
    ]);
  }, []);
  const handleChat = useCallback(() => { (navigation as any).navigate('Chat'); }, [navigation]);
  const handleSelectCloudModel = useCallback((model: CloudModel) => {
    settingsStore.setApp('chatBackend', model.provider);
    if (model.provider === 'openai') settingsStore.setApp('openaiModel', model.modelId);
    if (model.provider === 'anthropic') settingsStore.setApp('anthropicModel', model.modelId);
    if (model.provider === 'gemini') settingsStore.setApp('geminiModel', model.modelId);
    (navigation as any).navigate('Chat');
  }, [navigation]);
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
  const handleAddCustomModel = async (file: any, repoId: string) => {
    const id = repoId.replace('/', '-') + '-' + file.filename.replace('.gguf', '');
    const custom: CuratedModel = {
      id, displayName: file.filename.replace('.gguf', ''), name: file.filename,
      quantization: extractQuantization(file.filename), sizeLabel: file.sizeLabel, sizeBytes: file.size,
      capabilities: ['Chat'], parameters: 'Unknown', author: repoId.split('/')[0] ?? '',
      hfRepoId: repoId, hfUrl: 'https://huggingface.co/' + repoId, downloadUrl: file.downloadUrl,
    };
    setSearchModal(false);
    setSelectedRepo(null);
    await downloadModel(custom, () => {});
  };

  // ---- Derived data ----
  const filterAndSortModels = useCallback((list: CuratedModel[]) => {
    const q = nameSearch.trim().toLowerCase();
    return [...list].filter((m) => {
      const b = parametersToB(m.parameters);
      if (b < paramMinB || b > paramMaxB) return false;
      if (q && !(m.displayName + ' ' + m.name + ' ' + m.author).toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => sortBy === 'sizeAsc' ? a.sizeBytes - b.sizeBytes : b.sizeBytes - a.sizeBytes);
  }, [sortBy, nameSearch, paramMinB, paramMaxB]);

  const installedForDisplay = useMemo((): CuratedModel[] =>
    modelStore.installedModels.map((m) => ({
      id: m.id, displayName: m.displayName, name: m.name, quantization: m.quantization,
      sizeLabel: m.sizeLabel, sizeBytes: m.sizeBytes, capabilities: m.capabilities,
      parameters: m.parameters, author: m.author, hfRepoId: m.hfRepoId, hfUrl: m.hfUrl, downloadUrl: '',
    })),
  [modelStore.installedModels]);

  const categoryModels = useMemo(() => {
    if (!selectedCategory) return [];
    const all = CURATED_MODELS.filter(m => m.categories?.includes(selectedCategory));
    return filterAndSortModels(all);
  }, [selectedCategory, filterAndSortModels]);

  const categoryModelsList = useMemo(() => {
    const installedIds = new Set(modelStore.installedModels.map(m => m.id));
    const installed = categoryModels.filter(m => installedIds.has(m.id));
    const available = categoryModels.filter(m => !installedIds.has(m.id));
    return [...installed, ...available];
  }, [categoryModels, modelStore.installedModels]);

  const onDeviceModels = useMemo(() => {
    const all = filterAndSortModels(CURATED_MODELS);
    const installedIds = new Set(modelStore.installedModels.map(m => m.id));
    const installed = installedForDisplay;
    const available = all.filter(m => !installedIds.has(m.id));
    return [...installed, ...available];
  }, [filterAndSortModels, installedForDisplay, modelStore.installedModels]);

  const availableCloudModels = useMemo(() => ALL_CLOUD_MODELS.filter((m) => {
    if (m.provider === 'openai') return secretsStore.openaiKey.trim().length > 0;
    if (m.provider === 'anthropic') return secretsStore.anthropicKey.trim().length > 0;
    if (m.provider === 'gemini') return secretsStore.geminiKey.trim().length > 0;
    return false;
  }), [secretsStore.openaiKey, secretsStore.anthropicKey, secretsStore.geminiKey]);

  const filteredCloudModels = useMemo(() => {
    if (activeFilter === 'claude') return availableCloudModels.filter(m => m.provider === 'anthropic');
    if (activeFilter === 'chatgpt') return availableCloudModels.filter(m => m.provider === 'openai');
    if (activeFilter === 'gemini') return availableCloudModels.filter(m => m.provider === 'gemini');
    return [];
  }, [availableCloudModels, activeFilter]);

  const countForCategory = useCallback((cat: ModelCategory) =>
    CURATED_MODELS.filter(m => m.categories?.includes(cat)).length
  , []);

  const recGb = (modelStore.recommendedMaxBytes / (1024 * 1024 * 1024)).toFixed(1);
  const isCloudFilter = activeFilter === 'claude' || activeFilter === 'chatgpt' || activeFilter === 'gemini';
  const showList = activeFilter === 'ondevice' || isCloudFilter || selectedCategory !== null;

  // ---- Render helpers ----
  const renderCategoryGrid = () => {
    const rows: CategoryDef[][] = [];
    for (let i = 0; i < CATEGORIES.length; i += 2) {
      rows.push(CATEGORIES.slice(i, i + 2));
    }
    return (
      <>
        {installedForDisplay.length > 0 && (
          <>
            <Text style={styles.installedTitle}>Installed Models</Text>
            {installedForDisplay.map(model => (
              <ModelCard key={model.id} model={model} onDownload={handleDownload} onCancelDownload={handleCancelDownload} onLoad={handleLoad} onDelete={handleDelete} onChat={handleChat} />
            ))}
            <Text style={[styles.installedTitle, { marginTop: 20 }]}>Explore Categories</Text>
          </>
        )}
        {!installedForDisplay.length && <Text style={styles.installedTitle}>Explore Categories</Text>}
        {rows.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.85}
                onPress={() => { setSelectedCategory(cat.key); setActiveFilter('models'); }}
                style={[styles.tile, { backgroundColor: cat.color, shadowColor: cat.color }]}
              >
                <View style={styles.tileIconRow}>
                  <View style={[styles.tileIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color="#fff" />
                  </View>
                  <Text style={styles.tileCount}>{countForCategory(cat.key)} models</Text>
                </View>
                <View>
                  <Text style={styles.tileName}>{cat.label}</Text>
                  <Text style={styles.tileDesc}>{cat.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </>
    );
  };

  const renderListControls = () => (
    <>
      {!isCloudFilter && (
        <View style={styles.deviceRow}>
          <MaterialCommunityIcons name="cellphone" size={16} color={Colors.primary} />
          <Text style={styles.deviceText}>{modelStore.deviceRAMGb} GB RAM · Models up to {recGb} GB</Text>
        </View>
      )}
      {!isCloudFilter && (
        <>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.metaText} />
            <TextInput style={styles.searchInput} value={nameSearch} onChangeText={setNameSearch} placeholder="Search models..." placeholderTextColor={Colors.metaText} returnKeyType="search" />
            {nameSearch.length > 0 && (
              <TouchableOpacity onPress={() => setNameSearch('')} hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.metaText} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity style={[styles.sortChip, sortBy === 'sizeAsc' && styles.sortChipActive]} onPress={() => setSortBy('sizeAsc')}>
              <MaterialCommunityIcons name="sort-ascending" size={14} color={sortBy === 'sizeAsc' ? Colors.onPrimary : Colors.onSurfaceVariant} />
              <Text style={[styles.sortChipText, sortBy === 'sizeAsc' && styles.sortChipTextActive]}>Smallest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortChip, sortBy === 'sizeDesc' && styles.sortChipActive]} onPress={() => setSortBy('sizeDesc')}>
              <MaterialCommunityIcons name="sort-descending" size={14} color={sortBy === 'sizeDesc' ? Colors.onPrimary : Colors.onSurfaceVariant} />
              <Text style={[styles.sortChipText, sortBy === 'sizeDesc' && styles.sortChipTextActive]}>Largest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterToggle, showFilters && styles.filterToggleActive]} onPress={() => setShowFilters(v => !v)}>
              <MaterialCommunityIcons name="tune-vertical" size={14} color={showFilters ? Colors.primary : Colors.onSurfaceVariant} />
              <Text style={[styles.filterToggleText, showFilters && { color: Colors.primary }]}>Filter</Text>
            </TouchableOpacity>
          </View>
          {showFilters && (
            <View style={styles.paramBox}>
              <Text style={styles.paramTitle}>Parameters: 0 – {maxParamB.toFixed(1)}B</Text>
              <RangeSlider minValue={paramMinB} maxValue={Math.min(paramMaxB, maxParamB)} rangeMin={PARAM_SLIDER_MIN} rangeMax={maxParamB} step={PARAM_SLIDER_STEP} decimals={1}
                onValueChange={(low, high) => { setParamMinB(low); setParamMaxB(high); }} />
            </View>
          )}
        </>
      )}
    </>
  );

  const activeCatDef = selectedCategory ? CATEGORIES.find(c => c.key === selectedCategory) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <MaterialCommunityIcons name="menu" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Models</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => (navigation as any).navigate('Settings')}>
          <MaterialCommunityIcons name="tune" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true} style={styles.filterBar} contentContainerStyle={{ gap: 6, paddingRight: 16 }}>
          {([
            { key: 'models' as FilterKey,  label: 'Models' },
            { key: 'ondevice' as FilterKey, label: 'On-Device' },
            { key: 'claude' as FilterKey,   label: 'Claude' },
            { key: 'chatgpt' as FilterKey,  label: 'ChatGPT' },
            { key: 'gemini' as FilterKey,   label: 'Gemini' },
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && !selectedCategory && styles.filterChipActive]}
              onPress={() => { setActiveFilter(f.key); setSelectedCategory(null); }}
            >
              <Text style={[styles.filterChipText, activeFilter === f.key && !selectedCategory && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category detail view */}
        {selectedCategory && activeCatDef && (
          <>
            <View style={styles.catHeader}>
              <TouchableOpacity style={styles.catBackBtn} onPress={() => setSelectedCategory(null)}>
                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
              <View style={[styles.tileIcon, { backgroundColor: activeCatDef.color + '20' }]}>
                <MaterialCommunityIcons name={activeCatDef.icon as any} size={20} color={activeCatDef.color} />
              </View>
              <Text style={styles.catTitle}>{activeCatDef.label}</Text>
            </View>
            {renderListControls()}
            {categoryModelsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="package-variant" size={28} color={Colors.onSurfaceVariant} />
                <Text style={styles.emptyCardText}>No models available in this category yet.{'\n'}Use the + button to search Hugging Face.</Text>
              </View>
            ) : (
              categoryModelsList.map(model => (
                <ModelCard key={model.id} model={model} onDownload={handleDownload} onCancelDownload={handleCancelDownload} onLoad={handleLoad} onDelete={handleDelete} onChat={handleChat} />
              ))
            )}
          </>
        )}

        {/* Models catalog (default) */}
        {activeFilter === 'models' && !selectedCategory && renderCategoryGrid()}

        {/* On-Device list */}
        {activeFilter === 'ondevice' && !selectedCategory && (
          <>
            {renderListControls()}
            {onDeviceModels.map(model => (
              <ModelCard key={model.id} model={model} onDownload={handleDownload} onCancelDownload={handleCancelDownload} onLoad={handleLoad} onDelete={handleDelete} onChat={handleChat} />
            ))}
          </>
        )}

        {/* Cloud filters */}
        {isCloudFilter && !selectedCategory && (
          <>
            {filteredCloudModels.map((m) => {
              const isActive = settingsStore.app.chatBackend === m.provider &&
                (m.provider === 'openai' ? settingsStore.app.openaiModel === m.modelId
                  : m.provider === 'anthropic' ? settingsStore.app.anthropicModel === m.modelId
                  : settingsStore.app.geminiModel === m.modelId);
              return <CloudModelCard key={m.id} model={m} isActive={isActive} onSelect={handleSelectCloudModel} />;
            })}
            {filteredCloudModels.length === 0 && (
              <TouchableOpacity style={styles.emptyCard} onPress={() => (navigation as any).navigate('Settings')}>
                <MaterialCommunityIcons name="key-plus" size={28} color={Colors.onSurfaceVariant} />
                <Text style={styles.emptyCardText}>
                  Add your {activeFilter === 'claude' ? 'Anthropic' : activeFilter === 'chatgpt' ? 'OpenAI' : 'Google'} API key in Settings to use these models.
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setSearchModal(true)} activeOpacity={0.8}>
        <LinearGradient colors={Colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <MaterialCommunityIcons name="plus" size={28} color={Colors.onPrimary} />
        </LinearGradient>
      </TouchableOpacity>

      {/* HF Search Modal */}
      <Modal visible={searchModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedRepo ? 'Select GGUF File' : 'Search Hugging Face'}</Text>
            <TouchableOpacity onPress={() => { if (selectedRepo) { setSelectedRepo(null); setGgufFiles([]); } else setSearchModal(false); }}>
              <MaterialCommunityIcons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>
          </View>
          {!selectedRepo ? (
            <>
              <View style={styles.searchBar}>
                <TextInput style={styles.modalSearchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search models (e.g. llama, mistral...)" placeholderTextColor={Colors.metaText} onSubmitEditing={handleSearch} returnKeyType="search" />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  {searching ? <ActivityIndicator size="small" color={Colors.onPrimary} /> : <MaterialCommunityIcons name="magnify" size={18} color={Colors.onPrimary} />}
                </TouchableOpacity>
              </View>
              <FlatList data={searchResults} keyExtractor={item => item.modelId}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectRepo(item.modelId)}>
                    <Text style={styles.resultName}>{item.modelId}</Text>
                    <Text style={styles.resultMeta}>{(item.downloads / 1000).toFixed(0)}k dl · {item.likes} likes</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={!searching ? <Text style={styles.emptyHint}>Search for GGUF models above</Text> : null}
              />
            </>
          ) : (
            <>
              <Text style={styles.repoLabel}>{selectedRepo}</Text>
              {loadingFiles ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
                <FlatList data={ggufFiles} keyExtractor={f => f.filename}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.resultItem} onPress={() => handleAddCustomModel(item, selectedRepo)}>
                      <Text style={styles.resultName}>{item.filename}</Text>
                      <Text style={styles.resultMeta}>{item.sizeLabel}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyHint}>No GGUF files found in this repo</Text>}
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
