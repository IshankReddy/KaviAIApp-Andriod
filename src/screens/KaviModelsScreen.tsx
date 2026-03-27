import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform, Animated, Easing,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, DesignTokens } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';

const LOGO_DARK = require('../../assets/logo-dark.png');
const LOGO_LIGHT = require('../../assets/logo-light.png');

export default observer(function KaviModelsScreen() {
  const navigation = useNavigation();
  const { Colors, dark } = useTheme();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.5)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(30)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 12 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.stagger(150, [
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.6, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(ringOpacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 800, useNativeDriver: true, delay: 200 }),
        ]),
        Animated.parallel([
          Animated.timing(ring2Scale, { toValue: 2, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(ring2Opacity, { toValue: 0.2, duration: 400, useNativeDriver: true }),
          Animated.timing(ring2Opacity, { toValue: 0, duration: 900, useNativeDriver: true, delay: 200 }),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(textTranslate, { toValue: 0, useNativeDriver: true, speed: 8, bounciness: 6 }),
        Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 14, delay: 200 }),
      ]),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    pulse.start();

    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear })
    );
    shimmer.start();

    return () => { pulse.stop(); shimmer.stop(); };
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

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
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: DesignTokens.borderRadius.sm },
    headerTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    logoWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    logo: { width: 80, height: 80 },
    ring: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    title: {
      color: Colors.onSurface,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.8,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      color: Colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 28,
      opacity: 0.8,
    },
    badgeWrap: { borderRadius: 24, overflow: 'hidden', marginBottom: 32 },
    badgeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    badgeText: { color: Colors.onPrimary, fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    featureList: { width: '100%', gap: 14 },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: Colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 16,
    },
    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureInfo: { flex: 1 },
    featureName: { color: Colors.onSurface, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    featureDesc: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '500', opacity: 0.7 },
  }), [Colors]);

  const FEATURES = [
    { icon: 'image-auto-adjust', color: '#6366F1', name: 'Image Generation', desc: 'Create images from text prompts' },
    { icon: 'microphone-outline', color: '#10B981', name: 'Voice & Audio', desc: 'Speech synthesis & recognition' },
    { icon: 'brain', color: '#EC4899', name: 'Advanced Reasoning', desc: 'Custom KaviAI fine-tuned models' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <MaterialCommunityIcons name="menu" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kavi AI Models</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
          <Animated.Image
            source={dark ? LOGO_DARK : LOGO_LIGHT}
            style={[styles.logo, {
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
              opacity: logoOpacity,
            }]}
            resizeMode="contain"
          />
        </View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslate }] }}>
          <Text style={styles.title}>Kavi AI Models</Text>
          <Text style={styles.subtitle}>
            Our own fine-tuned models are being trained{'\n'}specifically for on-device intelligence.
          </Text>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
          <View style={styles.badgeWrap}>
            <LinearGradient
              colors={Colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <MaterialCommunityIcons name="rocket-launch-outline" size={18} color={Colors.onPrimary} />
              <Text style={styles.badgeText}>COMING SOON</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View style={[styles.featureList, { opacity: textOpacity }]}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '18' }]}>
                <MaterialCommunityIcons name={f.icon as any} size={22} color={f.color} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>{f.name}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
});
