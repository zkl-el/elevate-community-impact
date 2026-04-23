
ALTER TABLE public.church_settings
  ADD COLUMN IF NOT EXISTS best_group_name text;

CREATE OR REPLACE FUNCTION public.get_public_dashboard()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  total_collected NUMERIC := 0;
  active_members INT := 0;
  current_project JSONB;
  best_group_data JSONB;
  annual_goal_amount NUMERIC := 0;
  best_name TEXT;
  current_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COUNT(DISTINCT user_id)
    INTO total_collected, active_members
  FROM public.contributions
  WHERE status = 'completed';

  SELECT cs.annual_goal, cs.best_group_name
    INTO annual_goal_amount, best_name
  FROM public.church_settings cs
  WHERE cs.year = current_year LIMIT 1;

  IF best_name IS NOT NULL AND length(trim(best_name)) > 0 THEN
    SELECT jsonb_build_object(
      'name', best_name,
      'total', COALESCE((
        SELECT SUM(c.amount)
        FROM public.groups g
        JOIN public.profiles p ON p.group_id = g.id
        JOIN public.contributions c ON c.user_id = p.id AND c.status = 'completed'
        WHERE lower(g.name) = lower(best_name)
      ), 0),
      'members', COALESCE((
        SELECT COUNT(*) FROM public.groups g
        JOIN public.profiles p ON p.group_id = g.id
        WHERE lower(g.name) = lower(best_name)
      ), 0)
    ) INTO best_group_data;
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
