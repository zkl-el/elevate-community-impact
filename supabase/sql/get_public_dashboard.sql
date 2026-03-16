CREATE OR REPLACE FUNCTION get_public_dashboard()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_collected', COALESCE(SUM(c.amount), 0),
    'active_members', COALESCE(count(DISTINCT c.user_id), 0)::int,
    'best_group', (
      SELECT jsonb_build_object(
        'name', g.name,
        'total', COALESCE(SUM(c.amount), 0)
      )
      FROM groups g
      LEFT JOIN profiles p ON p.group_id = g.id
      LEFT JOIN contributions c ON c.user_id = p.id
      GROUP BY g.id, g.name
      ORDER BY SUM(c.amount) DESC NULLS LAST
      LIMIT 1
    ),
    'groups_leaderboard', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'total', COALESCE(SUM(c.amount), 0),
          'member_count', COALESCE(count(DISTINCT p.id), 0)
        )
      )
      FROM groups g
      LEFT JOIN profiles p ON p.group_id = g.id
      LEFT JOIN contributions c ON c.user_id = p.id
      GROUP BY g.id, g.name
      ORDER BY SUM(c.amount) DESC NULLS LAST
      LIMIT 5
    ),
    'current_project', (
      SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'description', description,
        'target_amount', target_amount,
        'collected_amount', COALESCE((
          SELECT COALESCE(SUM(amount), 0)
          FROM contributions 
          WHERE project_id = projects.id
        ), 0),
        'status', status
      )
      FROM projects 
      WHERE status = 'ongoing'
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO result
  FROM contributions c;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant public execute (for guest dashboard access)
GRANT EXECUTE ON FUNCTION get_public_dashboard() TO authenticated, anon;

COMMENT ON FUNCTION get_public_dashboard() IS 'Public dashboard aggregates for church stats';

