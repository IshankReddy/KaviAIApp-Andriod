import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../stores/ChatStore';
import { useTheme } from '../theme/theme';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const { Colors } = useTheme();
  const isUser = message.role === 'user';
  const styles = useMemo(() => StyleSheet.create({
    row: { marginVertical: 4, marginHorizontal: 12, flexDirection: 'row' },
    rowRight: { justifyContent: 'flex-end' },
    rowLeft: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '82%',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userBubble: { backgroundColor: Colors.userBubble, borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: Colors.aiBubble, borderBottomLeftRadius: 4 },
    text: { fontSize: 15, lineHeight: 22 },
    userText: { color: Colors.userBubbleText },
    aiText: { color: Colors.aiBubbleText },
    metricsRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
    metricsText: { fontSize: 11, color: Colors.metaText, letterSpacing: 0.2 },
  }), [Colors]);

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>

        {/* Metrics footer for AI messages */}
        {!isUser && message.tokensPerSec !== undefined && (
          <View style={styles.metricsRow}>
            <Text style={styles.metricsText}>
              {message.msPerToken?.toFixed(0)}ms/token{'  ·  '}
              {message.tokensPerSec?.toFixed(2)} tokens/sec{'  ·  '}
              {message.ttftMs}ms TTFT
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

