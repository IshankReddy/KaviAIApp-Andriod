import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from '../stores/ChatStore';
import { useTheme, DesignTokens } from '../theme/theme';

import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const { Colors } = useTheme();
  const isUser = message.role === 'user';
  
  const styles = useMemo(() => StyleSheet.create({
    row: { 
      marginVertical: 6, 
      marginHorizontal: 16, 
      flexDirection: 'row' 
    },
    rowRight: { justifyContent: 'flex-end' },
    rowLeft: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '85%',
      borderRadius: DesignTokens.borderRadius.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    userBubble: {
      alignSelf: 'flex-end',
      marginRight: 12,
      marginBottom: 12,
      marginLeft: '15%',
      borderRadius: DesignTokens.borderRadius.lg,
      borderBottomRightRadius: 4,
      overflow: 'hidden', // Ensure gradient respects border radius
      ...Platform.select({
        ios: {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.surface,
      marginLeft: 12,
      marginBottom: 16,
      borderRadius: DesignTokens.borderRadius.lg,
      borderBottomLeftRadius: 4,
      borderWidth: 1.5,
      borderColor: Colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    text: { 
      fontSize: 16, 
      lineHeight: 22,
      fontWeight: '500', 
    },
    userText: { 
      color: Colors.userBubbleText,
      fontWeight: '600',
    },
    aiText: { 
      color: Colors.aiBubbleText 
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 6,
    },
    metaText: { 
      fontSize: 10, 
      color: Colors.metaText,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: DesignTokens.borderRadius.lg,
      borderBottomRightRadius: 4, // Match userBubble's specific corner
    },
  }), [Colors]);

  if (isUser) {
    return (
      <View style={styles.userBubble}>
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.bubble}>
          <Text style={[styles.text, styles.userText]}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiBubble}>
      <View style={styles.bubble}>
        <Text style={[styles.text, styles.aiText]}>{message.content}</Text>
        {message.tokensPerSec ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={Colors.primary} />
            <Text style={styles.metaText}>{message.tokensPerSec.toFixed(1)} t/s</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

