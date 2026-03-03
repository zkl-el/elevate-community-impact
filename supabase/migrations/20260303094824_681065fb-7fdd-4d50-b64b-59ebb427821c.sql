
-- ==========================================
-- CHURCH RESOURCE MOBILIZATION SCHEMA
-- ==========================================

-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'finance_admin', 'group_leader', 'member');

-- 2. Member category enum
CREATE TYPE public.member_category AS ENUM ('visitor', 'student', 'church_member', 'regular');

-- 3. Project status enum
CREATE TYPE public.project_status AS ENUM ('ongoing', 'completed');

-- 4. Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  category member_category NOT NULL DEFAULT 'church_member',
  group_id UUID REFERENCES public.groups(id),
  annual_goal NUMERIC NOT NULL DEFAULT 0,
  total_contributed NUMERIC NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_contribution_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from groups.leader_id to profiles
ALTER TABLE public.groups ADD CONSTRAINT fk_groups_leader FOREIGN KEY (leader_id) REFERENCES public.profiles(id);

-- 6. User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, role)
);

-- 7. Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL DEFAULT 0,
  collected_amount NUMERIC NOT NULL DEFAULT 0,
  status project_status NOT NULL DEFAULT 'ongoing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'manual',
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Badges table
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  threshold_percent INTEGER
);

-- 10. User badges (earned)
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badges(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- 11. Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user's group_id
CREATE OR REPLACE FUNCTION public.get_user_group_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.profiles WHERE id = _user_id
$$;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can view same group members" ON public.profiles FOR SELECT
  USING (group_id = public.get_user_group_id(auth.uid()));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- USER_ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- GROUPS policies
CREATE POLICY "Anyone authenticated can view groups" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage groups" ON public.groups FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- PROJECTS policies
CREATE POLICY "Anyone can view projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));

-- CONTRIBUTIONS policies
CREATE POLICY "Users can view own contributions" ON public.contributions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all contributions" ON public.contributions FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'finance_admin'));
CREATE POLICY "Group leaders can view group contributions" ON public.contributions FOR SELECT
  USING (
    public.has_role(auth.uid(), 'group_leader')
    AND user_id IN (
      SELECT p.id FROM public.profiles p WHERE p.group_id = public.get_user_group_id(auth.uid())
    )
  );
CREATE POLICY "Users can insert own contributions" ON public.contributions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Finance admins can insert contributions" ON public.contributions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'finance_admin'));

-- BADGES policies
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- USER_BADGES policies
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (user_id = auth.uid());

-- AUDIT_LOG policies
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit entries" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'), NEW.phone);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Process contribution: update totals, XP, streak, badges
CREATE OR REPLACE FUNCTION public.process_contribution()
RETURNS TRIGGER AS $$
DECLARE
  _current_total NUMERIC;
  _annual_goal NUMERIC;
  _last_date DATE;
  _streak INTEGER;
  _xp_earned INTEGER;
  _new_percent NUMERIC;
BEGIN
  -- Get current user stats
  SELECT total_contributed, annual_goal, last_contribution_date, streak
  INTO _current_total, _annual_goal, _last_date, _streak
  FROM public.profiles WHERE id = NEW.user_id;

  -- Calculate XP (1 XP per 10 currency units, min 10)
  _xp_earned := GREATEST(10, (NEW.amount / 10)::INTEGER);

  -- Update streak
  IF _last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    _streak := _streak + 1;
  ELSIF _last_date < CURRENT_DATE - INTERVAL '1 day' OR _last_date IS NULL THEN
    _streak := 1;
  END IF;

  -- Update profile
  UPDATE public.profiles SET
    total_contributed = total_contributed + NEW.amount,
    xp = xp + _xp_earned,
    streak = _streak,
    last_contribution_date = CURRENT_DATE
  WHERE id = NEW.user_id;

  -- Update project if applicable
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects SET
      collected_amount = collected_amount + NEW.amount
    WHERE id = NEW.project_id;
  END IF;

  -- Check badge milestones
  _new_percent := ((_current_total + NEW.amount) / NULLIF(_annual_goal, 0)) * 100;

  -- First contribution badge
  IF _current_total = 0 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'first')
    ON CONFLICT DO NOTHING;
  END IF;

  IF _new_percent >= 25 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'quarter') ON CONFLICT DO NOTHING;
  END IF;
  IF _new_percent >= 50 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'half') ON CONFLICT DO NOTHING;
  END IF;
  IF _new_percent >= 75 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'three_quarter') ON CONFLICT DO NOTHING;
  END IF;
  IF _new_percent >= 100 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'complete') ON CONFLICT DO NOTHING;
  END IF;

  -- Streak badges
  IF _streak >= 7 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'streak7') ON CONFLICT DO NOTHING;
  END IF;
  IF _streak >= 30 THEN
    INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, 'streak30') ON CONFLICT DO NOTHING;
  END IF;

  -- Level up (every 500 XP base)
  UPDATE public.profiles SET level = CASE
    WHEN xp >= 10000 THEN 5
    WHEN xp >= 5000 THEN 4
    WHEN xp >= 2000 THEN 3
    WHEN xp >= 500 THEN 2
    ELSE 1
  END WHERE id = NEW.user_id;

  -- Audit log
  INSERT INTO public.audit_log (user_id, action, details) VALUES (
    NEW.user_id, 'contribution',
    jsonb_build_object('amount', NEW.amount, 'project_id', NEW.project_id, 'xp_earned', _xp_earned)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_contribution_created AFTER INSERT ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.process_contribution();

-- ==========================================
-- SEED BADGES
-- ==========================================
INSERT INTO public.badges (id, name, description, icon, threshold_percent) VALUES
  ('first', 'First Step', 'Made your first contribution', '⭐', NULL),
  ('quarter', '25% There', 'Reached 25% of your goal', '🔥', 25),
  ('half', 'Halfway Hero', 'Reached 50% of your goal', '🎯', 50),
  ('three_quarter', 'Almost There', 'Reached 75% of your goal', '🚀', 75),
  ('complete', 'Goal Crusher', 'Completed your annual goal!', '🏆', 100),
  ('streak7', 'Weekly Warrior', '7-day contribution streak', '💎', NULL),
  ('streak30', 'Monthly Champion', '30-day contribution streak', '🌟', NULL);

-- ==========================================
-- PUBLIC VIEW FOR DASHBOARD (no auth needed)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_public_dashboard()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_collected', COALESCE((SELECT SUM(total_contributed) FROM profiles), 0),
    'active_members', (SELECT COUNT(*) FROM profiles WHERE total_contributed > 0),
    'best_group', (
      SELECT json_build_object('name', g.name, 'total', COALESCE(SUM(p.total_contributed), 0), 'members', COUNT(p.id))
      FROM groups g LEFT JOIN profiles p ON p.group_id = g.id
      GROUP BY g.id, g.name ORDER BY SUM(p.total_contributed) DESC NULLS LAST LIMIT 1
    ),
    'groups_leaderboard', (
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT g.id, g.name, COALESCE(SUM(p.total_contributed), 0) as total, COUNT(p.id) as member_count
        FROM groups g LEFT JOIN profiles p ON p.group_id = g.id
        GROUP BY g.id, g.name ORDER BY total DESC
      ) t
    ),
    'current_project', (
      SELECT row_to_json(t) FROM (
        SELECT id, name, description, target_amount, collected_amount, status
        FROM projects WHERE status = 'ongoing' ORDER BY created_at DESC LIMIT 1
      ) t
    )
  )
$$;
