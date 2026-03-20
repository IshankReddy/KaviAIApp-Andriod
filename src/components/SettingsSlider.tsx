import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, DesignTokens } from '../theme/theme';
import { Platform } from 'react-native';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  decimals?: number;
  onValueChange: (val: number) => void;
}

export default function SettingsSlider({
  label, value, min, max, step = 0.05, decimals = 2, onValueChange,
}: Props) {
  const { Colors } = useTheme();
  const pct = ((value - min) / (max - min)) * 100;
  const styles = useMemo(() => StyleSheet.create({
    container: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 },
    label: { 
      color: Colors.onSurface, 
      fontSize: 14, 
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    value: { 
      color: Colors.primary, 
      fontSize: 14, 
      fontWeight: '800' 
    },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    btn: {
      width: 36,
      height: 36,
      borderRadius: DesignTokens.borderRadius.sm,
      backgroundColor: Colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    btnText: { 
      color: Colors.onSurface, 
      fontSize: 20, 
      lineHeight: 24,
      fontWeight: '600',
    },
    track: {
      flex: 1,
      height: 6,
      backgroundColor: Colors.border,
      borderRadius: 3,
      position: 'relative',
      overflow: 'visible',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 6,
      backgroundColor: Colors.primary,
      borderRadius: 3,
    },
    thumb: {
      position: 'absolute',
      top: -8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.primary,
      marginLeft: -11,
      ...Platform.select({
        ios: {
          shadowColor: Colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        android: {
          elevation: 4,
        },
      }),
    },
  }), [Colors]);

  const decrement = () => {
    const next = Math.max(min, parseFloat((value - step).toFixed(10)));
    onValueChange(next);
  };
  const increment = () => {
    const next = Math.min(max, parseFloat((value + step).toFixed(10)));
    onValueChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{typeof value === 'number' && !Number.isInteger(value)
          ? value.toFixed(decimals) : value}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.btn} onPress={decrement}>
          <Text style={styles.btnText}>−</Text>
        </TouchableOpacity>
        <View style={styles.track}>
          <View style={[styles.fill, { width: (pct + '%') as any }]} />
          <View style={[styles.thumb, { left: (pct + '%') as any }]} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={increment}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

