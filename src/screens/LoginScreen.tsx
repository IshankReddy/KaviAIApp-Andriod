import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { authStore } from '../stores/AuthStore';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default observer(function LoginScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { Colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
    topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    topTitle: { flex: 1, textAlign: 'center', color: Colors.onSurface, fontSize: 16, fontWeight: '600' },
    title: { color: Colors.onSurface, fontSize: 28, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
    subtitle: { color: Colors.metaText, fontSize: 14, marginBottom: 24, lineHeight: 19 },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 16,
    },
    label: { color: Colors.onSurfaceVariant, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    input: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceVariant,
      color: Colors.onSurface,
      paddingHorizontal: 14,
      marginBottom: 12,
      fontSize: 15,
    },
    btnRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    btnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    btnSecondary: { backgroundColor: Colors.surface, borderColor: Colors.border },
    btnTextPrimary: { color: Colors.onPrimary, fontSize: 14, fontWeight: '700' },
    btnTextSecondary: { color: Colors.onSurface, fontSize: 14, fontWeight: '700' },
    error: { color: Colors.error, marginTop: 12, lineHeight: 18 },
    hint: { color: Colors.metaText, marginTop: 16, fontSize: 12, lineHeight: 17 },
    success: { color: Colors.primaryLight, marginTop: 12, lineHeight: 18 },
    linkBtn: { marginTop: 12, alignSelf: 'flex-start' },
    linkText: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
  }), [Colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [didSignUp, setDidSignUp] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      void authStore.refreshSessionIfNeeded().then(() => {
        if (authStore.isSignedIn && authStore.isEmailVerified) {
          navigation.goBack();
        }
      });
    }, [navigation])
  );

  const canSubmit = isValidEmail(email) && password.length >= 6 && !authStore.isLoading;

  const onSignIn = async () => {
    if (!canSubmit) return;
    setDidSignUp(false);
    const ok = await authStore.signIn(email.trim(), password);
    if (ok && authStore.isSignedIn && authStore.isEmailVerified) {
      navigation.goBack();
    }
  };

  const onSignUp = async () => {
    if (!canSubmit) return;
    const ok = await authStore.signUp(email.trim(), password);
    if (!ok) return;
    // If email confirmation is required, keep the user here until they verify.
    if (authStore.isSignedIn && authStore.isEmailVerified) navigation.goBack();
    else setDidSignUp(true);
  };

  const onResend = async () => {
    if (!isValidEmail(email) || authStore.isLoading) return;
    await authStore.resendVerification(email.trim());
    setDidSignUp(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{route?.params?.mode === 'signup' ? 'Create account' : 'Account'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>
          Sign in to access gated Hugging Face models and cloud chat (ChatGPT, Claude, Gemini).
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={Colors.metaText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            placeholderTextColor={Colors.metaText}
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, !canSubmit && { opacity: 0.6 }]}
              onPress={onSignUp}
              disabled={!canSubmit}
            >
              <Text style={styles.btnTextSecondary}>{authStore.isLoading ? 'Working…' : 'Sign up'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !canSubmit && { opacity: 0.6 }]}
              onPress={onSignIn}
              disabled={!canSubmit}
            >
              <Text style={styles.btnTextPrimary}>{authStore.isLoading ? 'Working…' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>

          {!!authStore.error && <Text style={styles.error}>{authStore.error}</Text>}
          {didSignUp && (
            <>
              <Text style={styles.success}>
                Check your inbox to verify your email, then sign in.
              </Text>
              <Text style={[styles.hint, { marginTop: 8 }]}>
                Tap the link on this device. If it opens in Gmail, use “Open in browser” (Chrome/Safari) so the app can open.
              </Text>
            </>
          )}

          <TouchableOpacity style={styles.linkBtn} onPress={onResend} disabled={!isValidEmail(email) || authStore.isLoading}>
            <Text style={styles.linkText}>Resend verification email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          You can use KaviAI without an account. Login is only required for gated models and cloud providers.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
});

