import { makeAutoObservable, runInAction } from 'mobx';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { ensureProfile } from '../services/profileService';
import { kvDel, kvGet, kvSet } from '../services/kv';
import * as Linking from 'expo-linking';

const SESSION_KEY = 'kaviai.supabase.session.v1';

function formatAuthError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('rate_limit')) {
    return 'Email rate limit reached. Wait a few minutes or set up Custom SMTP in Supabase (Project Settings → Auth).';
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('user already')) {
    return 'Account already exists. Please sign in, or use "Resend verification email".';
  }
  return message;
}

/**
 * Redirect URL for verification emails.
 * - If app.json extra.verificationSuccessUrl is set (e.g. https://yoursite.com/auth-success), the link will open that page and show "Email verified! Open the app and sign in." (no blank page).
 * - Otherwise uses kaviai://auth/callback (deep link into the app).
 * Must be allowlisted in Supabase Auth → URL Configuration → Redirect URLs.
 */
function getEmailRedirectTo(): string {
  return 'https://project-s0syc-chta4448s-ishankreddys-projects.vercel.app/';
}

class AuthStore {
  session: Session | null = null;
  user: User | null = null;
  isHydrated = false;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isSignedIn() {
    return !!this.session?.access_token && !!this.user;
  }

  get isEmailVerified() {
    const u: any = this.user as any;
    return !!(u?.email_confirmed_at || u?.confirmed_at);
  }

  get emailRedirectTo() {
    return getEmailRedirectTo();
  }

  async handleAuthCallbackUrl(url: string): Promise<boolean> {
    try {
      const parsed = Linking.parse(url);
      const qp = parsed.queryParams ?? {};

      const code = typeof qp.code === 'string' ? qp.code : null;
      const token_hash = typeof qp.token_hash === 'string' ? qp.token_hash : null;
      const type = typeof qp.type === 'string' ? (qp.type as any) : null;
      const access_token = typeof qp.access_token === 'string' ? qp.access_token : null;
      const refresh_token = typeof qp.refresh_token === 'string' ? qp.refresh_token : null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        runInAction(() => {
          this.session = data.session;
          this.user = data.session?.user ?? null;
        });
        await this.persistSession(data.session);
        if (data.session?.user) {
          await ensureProfile(data.session.user.id, data.session.user.email);
        }
        return true;
      }

      if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
        if (error) throw error;
        runInAction(() => {
          this.session = data.session;
          this.user = data.user ?? data.session?.user ?? null;
        });
        await this.persistSession(data.session ?? null);
        const u = data.user ?? data.session?.user;
        if (u) await ensureProfile(u.id, u.email);
        return true;
      }

      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
        runInAction(() => {
          this.session = data.session;
          this.user = data.session?.user ?? null;
        });
        await this.persistSession(data.session);
        if (data.session?.user) {
          await ensureProfile(data.session.user.id, data.session.user.email);
        }
        return true;
      }

      return false;
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message ? String(e.message) : 'Verification failed';
      });
      return false;
    }
  }

  async hydrate(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const raw = await kvGet(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        const { data, error } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (error) throw error;
        runInAction(() => {
          this.session = data.session;
          this.user = data.session?.user ?? null;
        });
        if (data.session?.user) {
          await ensureProfile(data.session.user.id, data.session.user.email);
        }
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        runInAction(() => {
          this.session = session;
          this.user = session?.user ?? null;
        });
        void this.persistSession(session);
      });
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message ? String(e.message) : 'Failed to load session';
        this.session = null;
        this.user = null;
      });
      await kvDel(SESSION_KEY);
    } finally {
      runInAction(() => {
        this.isHydrated = true;
        this.isLoading = false;
      });
    }
  }

  private async persistSession(session: Session | null): Promise<void> {
    try {
      if (!session) {
        await kvDel(SESSION_KEY);
        return;
      }
      await kvSet(SESSION_KEY, JSON.stringify(session));
    } catch {
      // If SecureStore fails, keep user signed-in for the current run; they may need to log in again next launch.
    }
  }

  async signIn(email: string, password: string, options?: { silent?: boolean }): Promise<boolean> {
    if (!options?.silent) {
      this.isLoading = true;
      this.error = null;
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      runInAction(() => {
        this.session = data.session;
        this.user = data.user;
      });
      await this.persistSession(data.session);
      if (data.user) await ensureProfile(data.user.id, data.user.email);
      return true;
    } catch (e: any) {
      if (!options?.silent) {
        runInAction(() => {
          this.error = formatAuthError(e?.message, 'Sign in failed');
        });
      }
      return false;
    } finally {
      if (!options?.silent) {
        runInAction(() => {
          this.isLoading = false;
        });
      }
    }
  }

  async signUp(email: string, password: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: this.emailRedirectTo },
      });
      if (error) throw error;
      const maybeIdentities = ((data.user as any)?.identities ?? []) as any[];
      // Supabase can return a "masked success" for existing accounts; detect and surface a clear error.
      if (data.user && maybeIdentities.length === 0) {
        throw new Error('Account already exists. Please sign in, or use "Resend verification email".');
      }
      runInAction(() => {
        this.session = data.session;
        this.user = data.user ?? null;
      });
      await this.persistSession(data.session ?? null);
      if (data.user) await ensureProfile(data.user.id, data.user.email);
      return true;
    } catch (e: any) {
      runInAction(() => {
        this.error = formatAuthError(e?.message, 'Sign up failed');
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async resendVerification(email: string): Promise<boolean> {
    this.isLoading = true;
    this.error = null;
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: this.emailRedirectTo },
      });
      if (error) throw error;
      return true;
    } catch (e: any) {
      runInAction(() => {
        this.error = formatAuthError(e?.message, 'Failed to resend email');
      });
      return false;
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /** Call when app gains focus or login screen is shown – picks up email_confirmed_at after user verifies in browser. */
  async refreshSessionIfNeeded(): Promise<void> {
    if (!this.session?.access_token || this.isEmailVerified) return;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) return;
      runInAction(() => {
        this.session = data.session;
        this.user = data.session?.user ?? null;
      });
      await this.persistSession(data.session);
    } catch {
      // ignore
    }
  }

  async signOut(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      await supabase.auth.signOut();
    } catch (e: any) {
      runInAction(() => {
        this.error = e?.message ? String(e.message) : 'Sign out failed';
      });
    } finally {
      runInAction(() => {
        this.session = null;
        this.user = null;
        this.isLoading = false;
      });
      await kvDel(SESSION_KEY);
    }
  }
}

export const authStore = new AuthStore();

