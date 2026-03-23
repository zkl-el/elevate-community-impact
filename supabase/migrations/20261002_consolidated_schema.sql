-- Consolidated Schema Migration (20261002) - All schema, triggers, RLS in one safe file
-- Run on fresh DB: supabase db reset && supabase migration up
-- Idempotent: CREATE/ALTER IF NOT EXISTS

BEGIN;

-- 1. Drop legacy generate_otp function (if exists)
DROP FUNCTION IF EXISTS public.generate_otp(TEXT, TEXT) CASCADE;

-- 2. PLEDGES table + policies + indexes
CREATE TABLE IF NOT EXISTS public.pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pledge_amount NUMERIC NOT NULL CHECK (pledge_amount >= 0),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE IF EXISTS public.pledges ENABLE ROW LEVEL SECURITY;

-- Clean old policies
DROP POLICY IF EXISTS "Users can view own pledges" ON public.pledges;
DROP POLICY IF EXISTS "Users can create own pledges" ON public.pledges;
DROP POLICY IF EXISTS "Users can update own pledges" ON public.pledges;
DROP POLICY IF EXISTS "Group leaders can view group pledges" ON public.pledges;
DROP POLICY IF EXISTS "Finance admins can view all pledges" ON public.pledges;
DROP POLICY IF EXISTS "Users own pledges" ON public.pledges;
DROP POLICY IF EXISTS "Group leaders view group" ON public.pledges;
DROP POLICY IF EXISTS "Admins view all" ON public.pledges;

-- Create essential policies
CREATE POLICY "Users own pledges" ON public.pledges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Group leaders view group" ON public.pledges FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = pledges.user_id AND p.group_id IN (SELECT group_id FROM public.profiles WHERE id = auth.uid()))
);
CREATE POLICY "Admins view all" ON public.pledges FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('finance_admin', 'super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_pledges_user_id ON public.pledges(user_id);
CREATE INDEX IF NOT EXISTS idx_pledges_year ON public.pledges(year);

-- 3. OTP_CODES table (evolved structure, idempotent recreate)
DROP TABLE IF EXISTS public.otp_codes;
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  full_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert otp_codes" ON public.otp_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select otp_codes" ON public.otp_codes FOR SELECT USING (true);
CREATE POLICY "Allow public update otp_codes" ON public.otp_codes FOR UPDATE USING (true);

-- 4. PROFILES enhancements
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.create_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_profile();

-- 6. updated_at trigger function (generic)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables if they have updated_at
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END;
END $$;

-- RLS for profiles (conservative)
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;

