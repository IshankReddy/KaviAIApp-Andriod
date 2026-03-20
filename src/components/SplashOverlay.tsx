import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';

const LOGO = require('../../assets/logo.png');
const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export default function SplashOverlay({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(18)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Logo appears slowly with gentle spring
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 4, bounciness: 10 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(ringScale, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),

      // Phase 2: Slow flash burst
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(flash, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.cubic) }),
      ]),

      // Phase 3: Title + subtitle fade in slowly
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(subOpacity, { toValue: 1, duration: 700, delay: 250, useNativeDriver: true }),
      ]),

      // Hold longer
      Animated.delay(1000),

      // Phase 4: Slow fade out
      Animated.timing(fadeOut, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]} pointerEvents="none">
      {/* Radial ring pulse */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: Animated.multiply(ringOpacity, Animated.subtract(new Animated.Value(1), flash)),
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Flash burst */}
      <Animated.View
        style={[
          styles.flashCircle,
          { opacity: flash, transform: [{ scale: Animated.add(new Animated.Value(1), Animated.multiply(flash, new Animated.Value(0.5))) }] },
        ]}
      />

      {/* Logo */}
      <Animated.Image
        source={LOGO}
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
        resizeMode="contain"
      />

      {/* Brand name */}
      <Animated.Text
        style={[
          styles.title,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        ]}
      >
        KaviAI
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subOpacity }]}>
        Your AI, your device.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0D11',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  flashCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 24,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});
