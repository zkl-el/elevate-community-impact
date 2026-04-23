
ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS best_group_percentage numeric;

CREATE OR REPLACE FUNCTION public.get_public_dashboard()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  total_collected NUMERIC := 0;
  active_members INT := 0;
  current_project JSONB;
  best_group_data JSONB;
  annual_goal_amount NUMERIC := 0;
  best_name TEXT;
  best_pct NUMERIC;
  current_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(DISTINCT user_id)
    INTO total_collected, active_members
  FROM public.contributions
  WHERE status = 'completed';

  SELECT cs.annual_goal, cs.best_group_name, cs.best_group_percentage
    INTO annual_goal_amount, best_name, best_pct
  FROM public.church_settings cs
  WHERE cs.year = current_year LIMIT 1;

  IF best_name IS NOT NULL AND length(trim(best_name)) > 0 THEN
    best_group_data := jsonb_build_object(
      'name', best_name,
      'percentage', COALESCE(best_pct, 0)
    );
  END IF;

  SELECT jsonb_build_object(
    'id', p.id, 'name', p.name, 'description', p.description,
    'target_amount', p.target_amount, 'collected_amount', p.collected_amount,
    'status', p.status
  )
  INTO current_project
  FROM public.projects p
  WHERE p.status = 'ongoing'
  ORDER BY p.created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'total_collected', total_collected,
    'active_members', active_members,
    'annual_goal', COALESCE(annual_goal_amount, 0),
    'current_project', COALESCE(current_project, '{}'::jsonb),
    'best_group', COALESCE(best_group_data, NULL),
    'groups_leaderboard', NULL
  );
END;
$$;
