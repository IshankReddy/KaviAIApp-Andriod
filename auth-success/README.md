# Verification success page

Deploy this folder so the email verification link opens a **message** (“Email verified – Open the app and sign in”) instead of a blank page or an app deep link.

1. Deploy to [Vercel](https://vercel.com) (drag this folder onto the site or run `npx vercel` from here) or any static host.
2. In the app’s `app.json`, add under `"expo"`:  
   `"extra": { "verificationSuccessUrl": "https://YOUR-URL/" }`
3. In Supabase: **Authentication** → **URL Configuration** → set **Site URL** and add to **Redirect URLs** the same `https://YOUR-URL/`.

After that, new verification emails will open this page. Users then open KaviAI and sign in; the app will see they’re verified.
