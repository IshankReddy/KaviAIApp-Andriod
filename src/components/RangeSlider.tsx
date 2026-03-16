import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme';

interface Props {
  minValue: number;
  maxValue: number;
  rangeMin: number;
  rangeMax: number;
  step?: number;
  decimals?: number;
  onValueChange: (minVal: number, maxVal: number) => void;
}

function roundToStep(val: number, step: number): number {
  return parseFloat((Math.round(val / step) * step).toFixed(10));
}

/** Single track with two thumbs; hold and drag to slide. */
export default function RangeSlider({
  minValue,
  maxValue,
  rangeMin,
  rangeMax,
  step = 0.1,
  decimals = 1,
  onValueChange,
}: Props) {
  const { Colors } = useTheme();
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, width: 300 });
  const onValueChangeRef = useRef(onValueChange);
  const minValueRef = useRef(minValue);
  const maxValueRef = useRef(maxValue);
  const rangeRef = useRef({ rangeMin, rangeMax, step });
  onValueChangeRef.current = onValueChange;
  minValueRef.current = minValue;
  maxValueRef.current = maxValue;
  rangeRef.current = { rangeMin, rangeMax, step };

  const span = Math.max(rangeMax - rangeMin, 0.01);
  const leftPct = ((minValue - rangeMin) / span) * 100;
  const rightPct = ((maxValue - rangeMin) / span) * 100;
  const fillLeft = leftPct;
  const fillWidth = rightPct - leftPct;

  const positionToValue = useCallback((x: number): number => {
    const layout = trackLayout.current;
    const { rangeMin: rMin, rangeMax: rMax, step: s } = rangeRef.current;
    if (layout.width <= 0) return rMin;
    const t = (x - layout.x) / layout.width;
    const raw = rMin + t * (rMax - rMin);
    return roundToStep(Math.max(rMin, Math.min(rMax, raw)), s);
  }, []);

  const saveTrackLayout = useCallback(() => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width: width || 300 };
    });
  }, []);

  const panMin = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => saveTrackLayout(),
      onPanResponderMove: (_evt, gestureState) => {
        const val = positionToValue(gestureState.moveX);
        onValueChangeRef.current(val, Math.max(val, maxValueRef.current));
      },
    }),
  ).current;

  const panMax = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => saveTrackLayout(),
      onPanResponderMove: (_evt, gestureState) => {
        const val = positionToValue(gestureState.moveX);
        onValueChangeRef.current(minValueRef.current, Math.min(val, rangeRef.current.rangeMax));
      },
    }),
  ).current;

  const formatB = (v: number) => `${v.toFixed(decimals)}B`;

  const styles = useMemo(() => StyleSheet.create({
    container: { marginBottom: 12 },
    trackWrap: { marginBottom: 4 },
    labelsAbove: { position: 'relative' as const, height: 22, marginBottom: 2 },
    pillWrap: {
      position: 'absolute' as const,
      top: 0,
      minWidth: 48,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: Colors.surfaceVariant,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillText: { color: Colors.onSurfaceVariant, fontSize: 11, fontWeight: '500' as const },
    track: {
      height: 8,
      backgroundColor: Colors.border,
      borderRadius: 4,
      position: 'relative' as const,
      overflow: 'visible' as const,
    },
    fill: {
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      backgroundColor: Colors.primary,
      borderRadius: 4,
    },
    thumb: {
      position: 'absolute' as const,
      top: -5,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.onSurface,
      borderWidth: 1,
      borderColor: Colors.border,
      marginLeft: -8,
    },
    trackLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingHorizontal: 2,
    },
    trackLabel: { color: Colors.metaText, fontSize: 11 },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <View style={styles.trackWrap}>
        <View style={styles.labelsAbove}>
          <View style={[styles.pillWrap, { left: (leftPct + '%') as any, marginLeft: -24 }]}>
            <Text style={styles.pillText}>{formatB(minValue)}</Text>
          </View>
          <View style={[styles.pillWrap, { left: (rightPct + '%') as any, marginLeft: -24 }]}>
            <Text style={styles.pillText}>{formatB(maxValue)}</Text>
          </View>
        </View>
        <View
          style={styles.track}
          ref={trackRef}
          onLayout={saveTrackLayout}
        >
          <View
            style={[
              styles.fill,
              {
                left: `${fillLeft}%`,
                width: `${fillWidth}%`,
              } as ViewStyle,
            ]}
          />
          <View
            style={[styles.thumb, { left: (leftPct + '%') as any }]}
            {...panMin.panHandlers}
          />
          <View
            style={[styles.thumb, { left: (rightPct + '%') as any }]}
            {...panMax.panHandlers}
          />
        </View>
        <View style={styles.trackLabels}>
          <Text style={styles.trackLabel}>{rangeMin}</Text>
          <Text style={styles.trackLabel}>{rangeMax}B</Text>
        </View>
      </View>
    </View>
  );
}
