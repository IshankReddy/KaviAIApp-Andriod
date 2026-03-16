import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/theme';

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
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { color: Colors.onSurface, fontSize: 14, fontWeight: '500' },
    value: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    btn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { color: Colors.onSurface, fontSize: 18, lineHeight: 22 },
    track: {
      flex: 1,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      position: 'relative',
      overflow: 'visible',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 4,
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    thumb: {
      position: 'absolute',
      top: -8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: Colors.onSurface,
      marginLeft: -10,
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

