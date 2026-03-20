# Supabase (KaviAI)

Project URL: **https://ftdxtvmjspmlmuksfxzz.supabase.co**

## Apply the migration

1. **Using Supabase MCP (recommended)**  
   In Cursor, add the [Supabase MCP server](https://supabase.com/docs/guides/getting-started/mcp) (Settings → MCP), then ask the AI to apply the migration:  
   *"Apply the migration in `KaviAI/supabase/migrations/20250319000000_create_profiles.sql` using Supabase MCP."*

2. **Using Supabase Dashboard**  
   Open [SQL Editor](https://supabase.com/dashboard/project/ftdxtvmjspmlmuksfxzz/sql/new), paste the contents of `migrations/20250319000000_create_profiles.sql`, and run it.

The migration creates the `public.profiles` table (linked to `auth.users`), RLS policies, and a trigger so new sign-ups get a profile row. The app syncs the signed-in user to this table on sign-in, sign-up, and session restore.

---

## Verification link shows a message (no blank page)

To avoid the link opening a blank page (e.g. on desktop browsers), redirect to a **web success page**.

1. **Deploy the success page**  
   From the project root: `cd KaviAI/auth-success` then deploy that folder (e.g. [Vercel](https://vercel.com): drag the folder to vercel.com or run `npx vercel`). Note the URL (e.g. `https://kaviai-auth.vercel.app`).

2. **Point the app to it**  
   In `app.json`, add under `"expo"`:  
   `"extra": { "verificationSuccessUrl": "https://YOUR-DEPLOYED-URL/" }`  
   (use the URL from step 1, with a trailing slash if your host serves `index.html` at that path).

3. **Allowlist in Supabase**  
   **Authentication** → **URL Configuration** → **Site URL**: set to that same HTTPS URL.  
   **Redirect URLs**: add that HTTPS URL. Save.

That page will show a friendly message, then it automatically forwards the verification query params into your app deep link (`kaviai://auth/callback?...`) so the app can complete verification and create the session.

---

## Verification link opens localhost / "can't be reached"

The email link must redirect into the app, not to `http://localhost:3000`. In the Dashboard:

1. **Authentication** → **URL Configuration**
2. Set **Site URL** to either your **verification success page URL** (see above) or:  
   `kaviai://auth/callback`
3. Under **Redirect URLs**, add the same URL. Save.

---

## Verification email not sending?

1. **Enable Confirm email**  
   Dashboard → **Authentication** → **Providers** → **Email** → turn **Confirm email** ON.

2. **Allow the app redirect URL**  
   Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs** → add:
   - `kaviai://auth/callback`  
   (or `kaviai://**` to allow any path under that scheme.)

3. **Use Custom SMTP (recommended)**  
   The built-in sender has low limits and can be unreliable.  
   Dashboard → **Project Settings** → **Auth** → **Custom SMTP** → set your SMTP (e.g. [Resend](https://resend.com), SendGrid, Mailgun). Then send a test from **Authentication** → **Email Templates**.
