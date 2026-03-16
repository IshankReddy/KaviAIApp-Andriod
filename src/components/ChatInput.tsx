import React, { useState, useMemo } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

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
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingHorizontal: 8,
      paddingVertical: 8,
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: Colors.inputBackground,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
    input: {
      flex: 1,
      color: Colors.onSurface,
      fontSize: 15,
      paddingHorizontal: 8,
      paddingVertical: 10,
      maxHeight: 120,
      textAlign: 'left',
      textAlignVertical: 'center',
    },
    inputExpanded: { minHeight: 80 },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
    },
    sendBtnDisabled: { backgroundColor: Colors.border },
    stopBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2,
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
    <View style={styles.container}>
      <View style={styles.bar}>
        {/* + button */}
        <TouchableOpacity style={styles.iconBtn} onPress={onPlusPress ?? (() => {})} disabled={disabled}>
          <MaterialCommunityIcons name="plus" size={22} color={disabled ? Colors.metaText : Colors.onSurface} />
        </TouchableOpacity>

        {/* Expand toggle */}
        <TouchableOpacity style={styles.iconBtn} onPress={() => setExpanded(e => !e)}>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-down' : 'chevron-up'}
            size={22}
            color={Colors.onSurface}
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
        />

        {/* Stop (when generating) or Send */}
        {isGenerating && onStop ? (
          <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.8}>
            <MaterialCommunityIcons name="stop" size={20} color={Colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || disabled}
          >
            <MaterialCommunityIcons name="send" size={20} color={Colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

