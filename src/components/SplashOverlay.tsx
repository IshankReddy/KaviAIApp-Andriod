import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, Dimensions, View } from 'react-native';
import { useTheme } from '../theme/theme';

const LOGO_DARK = require('../../assets/logo-dark.png');
const LOGO_LIGHT = require('../../assets/logo-light.png');
const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

const NUM_PARTICLES = 12;
const NUM_STREAKS = 6;

export default function SplashOverlay({ onFinish }: Props) {
  const { Colors, dark } = useTheme();

  const fadeOut = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  // Warp lines that streak inward toward center
  const streaks = useRef(
    Array.from({ length: NUM_STREAKS }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  // Logo
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Shockwave ring that blasts out when logo lands
  const shockScale = useRef(new Animated.Value(0.2)).current;
  const shockOpacity = useRef(new Animated.Value(0)).current;

  // Second slower ring
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  // Ambient glow
  const glowPulse = useRef(new Animated.Value(0)).current;

  // Floating particles that drift outward after shockwave
  const particles = useRef(
    Array.from({ length: NUM_PARTICLES }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    })),
  ).current;

  // Text
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleScaleX = useRef(new Animated.Value(1.15)).current;

  const subOpacity = useRef(new Animated.Value(0)).current;
  const subY = useRef(new Animated.Value(16)).current;

  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const particleAnims = particles.map((p, i) => {
      const angle = (i / NUM_PARTICLES) * Math.PI * 2;
      const dist = 80 + Math.random() * 60;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const dur = 600 + Math.random() * 400;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: tx, duration: dur, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(p.y, { toValue: ty, duration: dur, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(p.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.opacity, { toValue: 0.8, duration: 200, useNativeDriver: true }),
          Animated.delay(dur - 400),
          Animated.timing(p.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]);
    });

    const streakAnims = streaks.map((s, i) =>
      Animated.sequence([
        Animated.delay(i * 60),
        Animated.parallel([
          Animated.timing(s.opacity, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.timing(s.progress, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        ]),
        Animated.timing(s.opacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    );

    Animated.sequence([
      Animated.delay(150),

      // Phase 1: Speed lines streak toward center
      Animated.parallel(streakAnims),

      // Phase 2: Logo slams in with overshoot
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 12,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),

      // Phase 3: Shockwave + particles blast out
      Animated.parallel([
        // First ring - fast
        Animated.timing(shockScale, { toValue: 2.5, duration: 500, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.sequence([
          Animated.timing(shockOpacity, { toValue: 0.8, duration: 80, useNativeDriver: true }),
          Animated.timing(shockOpacity, { toValue: 0, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]),
        // Second ring - slower, wider
        Animated.sequence([
          Animated.delay(120),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 3, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.sequence([
              Animated.timing(ring2Opacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
              Animated.timing(ring2Opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
          ]),
        ]),
        // Particles
        Animated.stagger(30, particleAnims),
        // Ambient glow breathe
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.timing(glowPulse, { toValue: 0.5, duration: 600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        ]),
      ]),

      // Phase 4: Text reveals
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(titleScaleX, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(lineScale, { toValue: 1, delay: 150, useNativeDriver: true, tension: 100, friction: 12 }),
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(subOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(subY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
          ]),
        ]),
      ]),

      Animated.delay(700),

      // Phase 5: Exit
      Animated.parallel([
        Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        Animated.timing(exitScale, { toValue: 1.08, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
        Animated.timing(glowPulse, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onFinish());
  }, []);

  const bgColor = dark ? '#0B0D11' : '#F8FAFC';
  const primaryColor = dark ? '#7C3AED' : '#6366F1';
  const particleColor = dark ? '#A78BFA' : '#818CF8';
  const titleColor = dark ? '#F1F5F9' : '#1E293B';
  const subColor = dark ? '#94A3B8' : '#64748B';
  const streakColor = dark ? '#7C3AED' : '#6366F1';


  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bgColor, opacity: fadeOut, transform: [{ scale: exitScale }] }]}
      pointerEvents="none"
    >
      {/* Speed streaks converging to center */}
      {streaks.map((s, i) => {
        const angle = (i / NUM_STREAKS) * 360;
        const translateX = s.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0],
        });
        return (
          <Animated.View
            key={`streak-${i}`}
            style={[
              styles.streak,
              {
                backgroundColor: streakColor,
                opacity: s.opacity,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: s.progress.interpolate({ inputRange: [0, 1], outputRange: [-SW * 0.6, -20] }) },
                  { scaleY: s.progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.1] }) },
                ],
              },
            ]}
          />
        );
      })}

      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: primaryColor,
            opacity: Animated.multiply(glowPulse, new Animated.Value(dark ? 0.15 : 0.1)),
            transform: [{ scale: Animated.add(new Animated.Value(1), Animated.multiply(glowPulse, new Animated.Value(0.3))) }],
          },
        ]}
      />

      {/* Shockwave rings */}
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: primaryColor,
            borderWidth: 2,
            opacity: shockOpacity,
            transform: [{ scale: shockScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: primaryColor,
            borderWidth: 1,
            opacity: ring2Opacity,
            transform: [{ scale: ring2Scale }],
          },
        ]}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={`p-${i}`}
          style={[
            styles.particle,
            {
              backgroundColor: particleColor,
              width: 3 + (i % 3) * 2,
              height: 3 + (i % 3) * 2,
              borderRadius: 4,
              opacity: p.opacity,
              transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
            },
          ]}
        />
      ))}

      {/* Logo */}
      <Animated.Image
        source={dark ? LOGO_DARK : LOGO_LIGHT}
        style={[
          styles.logo,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
        resizeMode="contain"
      />

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            color: titleColor,
            opacity: titleOpacity,
            transform: [{ translateY: titleY }, { scaleX: titleScaleX }],
          },
        ]}
      >
        KaviAI
      </Animated.Text>

      {/* Accent line */}
      <Animated.View style={[styles.accentLine, { backgroundColor: primaryColor, transform: [{ scaleX: lineScale }] }]} />

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            color: subColor,
            opacity: subOpacity,
            transform: [{ translateY: subY }],
          },
        ]}
      >
        Your AI, your device.
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    overflow: 'hidden',
  },
  streak: {
    position: 'absolute',
    width: 2,
    height: SW * 0.4,
    borderRadius: 1,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  particle: {
    position: 'absolute',
  },
  logo: {
    width: 108,
    height: 108,
    marginBottom: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
  },
  accentLine: {
    width: 56,
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
