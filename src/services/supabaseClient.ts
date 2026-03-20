import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT:
// - Use ONLY the publishable/anon key on client.
// - Never ship a Supabase service role/secret key in a mobile app.
const SUPABASE_URL = 'https://ftdxtvmjspmlmuksfxzz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0UneyZLiGFr7TM8Iaf7D1g_5kndaGVS';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // We'll persist the session ourselves using SecureStore in AuthStore.
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

