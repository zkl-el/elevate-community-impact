-- 1. Church settings table (annual goal + featured best group)
CREATE TABLE IF NOT EXISTS public.church_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  annual_goal NUMERIC NOT NULL DEFAULT 0,
  best_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.church_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Church settings publicly viewable"
  ON public.church_settings FOR SELECT
  USING (true);

-- Only admin/super_admin can insert
CREATE POLICY "Admins can insert church settings"
  ON public.church_settings FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Only admin/super_admin can update
CREATE POLICY "Admins can update church settings"
  ON public.church_settings FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE TRIGGER trg_church_settings_updated_at
  BEFORE UPDATE ON public.church_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Tighten projects RLS: admin-only writes, public read of ongoing
DROP POLICY IF EXISTS "Anyone can create project" ON public.projects;
DROP POLICY IF EXISTS "Anyone can update project" ON public.projects;
DROP POLICY IF EXISTS "Projects publicly viewable" ON public.projects;

CREATE POLICY "Projects viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Admins can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3. Update get_public_dashboard to include annual goal & best group
CREATE OR REPLACE FUNCTION public.get_public_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_collected NUMERIC := 0;
  active_members INT := 0;
  current_project JSONB;
  best_group_data JSONB;
  annual_goal_amount NUMERIC := 0;
  current_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(DISTINCT user_id)
    INTO total_collected, active_members
  FROM public.contributions;

  SELECT cs.annual_goal INTO annual_goal_amount
  FROM public.church_settings cs
  WHERE cs.year = current_year
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'total', COALESCE(SUM(c.amount), 0),
    'members', (SELECT COUNT(*) FROM public.profiles p WHERE p.group_id = g.id)
  )
  INTO best_group_data
  FROM public.church_settings cs
  JOIN public.groups g ON g.id = cs.best_group_id
  LEFT JOIN public.profiles p ON p.group_id = g.id
  LEFT JOIN public.contributions c ON c.user_id = p.id
  WHERE cs.year = current_year AND cs.best_group_id IS NOT NULL
  GROUP BY g.id, g.name
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'description', p.description,
    'target_amount', p.target_amount,
    'collected_amount', p.collected_amount,
    'status', p.status
  )
  INTO current_project
  FROM public.projects p
  WHERE p.status = 'ongoing'
  ORDER BY p.created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'total_collected', total_collected,
    'active_members', active_members,
    'annual_goal', COALESCE(annual_goal_amount, 0),
    'current_project', COALESCE(current_project, '{}'::jsonb),
    'best_group', COALESCE(best_group_data, NULL),
    'groups_leaderboard', NULL
  );
END;
$function$;