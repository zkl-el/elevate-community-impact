
-- Only completed contributions count toward totals
CREATE OR REPLACE FUNCTION public.update_project_collected_amount()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.projects
  SET collected_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.contributions
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
      AND status = 'completed'
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_total_contributed()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.profiles
  SET total_contributed = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.contributions
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'completed'
  )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_dashboard()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
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
  FROM public.contributions
  WHERE status = 'completed';

  SELECT cs.annual_goal INTO annual_goal_amount
  FROM public.church_settings cs
  WHERE cs.year = current_year LIMIT 1;

  SELECT jsonb_build_object(
    'id', g.id, 'name', g.name,
    'total', COALESCE(SUM(c.amount), 0),
    'members', (SELECT COUNT(*) FROM public.profiles p WHERE p.group_id = g.id)
  )
  INTO best_group_data
  FROM public.church_settings cs
  JOIN public.groups g ON g.id = cs.best_group_id
  LEFT JOIN public.profiles p ON p.group_id = g.id
  LEFT JOIN public.contributions c ON c.user_id = p.id AND c.status = 'completed'
  WHERE cs.year = current_year AND cs.best_group_id IS NOT NULL
  GROUP BY g.id, g.name LIMIT 1;

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

-- Recompute existing aggregates so totals reflect the new rule immediately
UPDATE public.profiles p SET total_contributed = COALESCE((
  SELECT SUM(amount) FROM public.contributions c
  WHERE c.user_id = p.id AND c.status = 'completed'
), 0);

UPDATE public.projects pr SET collected_amount = COALESCE((
  SELECT SUM(amount) FROM public.contributions c
  WHERE c.project_id = pr.id AND c.status = 'completed'
), 0);
