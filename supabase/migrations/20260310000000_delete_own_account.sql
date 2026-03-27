-- Allow authenticated users to delete their own account.
-- Called from the mobile app via supabase.rpc('delete_own_account').
-- SECURITY DEFINER runs with the function owner's privileges so the
-- client can remove their auth.users row without needing admin access.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete the profile row first (FK or manual cleanup)
  DELETE FROM public.profiles WHERE id = auth.uid();

  -- Delete the auth user (requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Only authenticated users may call this function
REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
