/**
 * Profile service – syncs signed-in user to public.profiles at https://ftdxtvmjspmlmuksfxzz.supabase.co
 */
import { supabase } from './supabaseClient';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Ensure current user has a row in public.profiles (idempotent). Call after sign-in/sign-up. */
export async function ensureProfile(userId: string, email: string | undefined): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: email ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();
  if (error) {
    console.warn('[profileService] ensureProfile:', error.message);
    return null;
  }
  return data as Profile;
}

/** Fetch current user's profile. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}
