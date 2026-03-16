-- Add profiles role column + automatic profile creation trigger
-- Safe to run on existing DB

BEGIN;

-- Ensure profiles table matches spec (add missing columns)
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS role text DEFAULT 'member',
ADD COLUMN IF NOT EXISTS access_token text,
ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Auto profile creation function + trigger (task exact)
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

COMMIT;
