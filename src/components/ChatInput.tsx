import React, { useState, useMemo } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onPlusPress?: () => void;
  /** When true, show a Stop button that calls onStop instead of Send. */
  isGenerating?: boolean;
  onStop?: () => void;
}

export default function ChatInput({ onSend, disabled, placeholder, onPlusPress, isGenerating, onStop }: Props) {
  const { Colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const paddingBottom = Math.max(insets.bottom, 0) + 10;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderTopWidth: 1.5,
      borderTopColor: Colors.border,
      paddingHorizontal: 12,
      paddingTop: 10,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: Colors.background,
      borderRadius: DesignTokens.borderRadius.xl,
      borderWidth: 1.5,
      borderColor: Colors.border,
      paddingHorizontal: 6,
      paddingVertical: 6,
    },
    iconBtn: { 
      width: 38, 
      height: 38, 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: DesignTokens.borderRadius.sm,
    },
    input: {
      flex: 1,
      color: Colors.onSurface,
      fontSize: 16,
      fontWeight: '500',
      paddingHorizontal: 10,
      paddingVertical: 10,
      maxHeight: 120,
      textAlign: 'left',
      textAlignVertical: 'center',
    },
    inputExpanded: { minHeight: 80 },
    actionBtn: {
      width: 38,
      height: 38,
      borderRadius: DesignTokens.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
    },
    sendBtn: {
      backgroundColor: Colors.primary,
    },
    sendBtnDisabled: { 
      backgroundColor: Colors.surfaceVariant,
    },
    stopBtn: {
      backgroundColor: Colors.error,
    },
  }), [Colors]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    setExpanded(false);
  };

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.bar}>
        {/* + button */}
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={onPlusPress ?? (() => {})} 
          disabled={disabled}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={24} 
            color={disabled ? Colors.metaText : Colors.primary} 
          />
        </TouchableOpacity>

        {/* Expand toggle */}
        <TouchableOpacity 
          style={styles.iconBtn} 
          onPress={() => setExpanded(e => !e)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color={Colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            expanded && styles.inputExpanded,
          ]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder ?? 'Message KaviAI'}
          placeholderTextColor={Colors.metaText}
          multiline={expanded}
          numberOfLines={expanded ? 4 : 1}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          selectionColor={Colors.primary}
        />

        {/* Stop (when generating) or Send */}
        {isGenerating && onStop ? (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.stopBtn]} 
            onPress={onStop} 
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="stop" size={22} color={Colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn, 
              styles.sendBtn, 
              (!text.trim() || disabled) && styles.sendBtnDisabled
            ]}
            onPress={handleSend}
            disabled={!text.trim() || disabled}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="arrow-up" 
              size={24} 
              color={(!text.trim() || disabled) ? Colors.metaText : Colors.onPrimary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

