import { useQuery } from "@tanstack/react-query";
import { createSupabaseClient } from "@/lib/supabase/client";
// import type { Database } from "@/lib/supabase";

interface PublicDashboardData {
  total_collected: number;
  active_members: number;
  best_group: { name: string; total: number; members: number } | null;
  groups_leaderboard: Array<{ id: string; name: string; total: number; member_count: number }> | null;
  current_project: {
    id: string;
    name: string;
    description: string | null;
    target_amount: number;
    collected_amount: number;
    status: string;
  } | null;
}

export const usePublicDashboard = () => {
  return useQuery({
    queryKey: ["public-dashboard"],
    queryFn: async (): Promise<PublicDashboardData> => {
      const { data, error } = await createSupabaseClient().rpc("get_public_dashboard");
      if (error) throw error;
      return data as unknown as PublicDashboardData;
    },
    refetchInterval: 30000,
  });
};

export const useMemberDashboard = (userId: string | undefined) => {
  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const client = createSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("*, groups!profiles_group_id_fkey(name)")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const contributionsQuery = useQuery({
    queryKey: ["contributions", userId],
    queryFn: async () => {
      const client = createSupabaseClient();
      const { data, error } = await client
        .from("contributions")
        .select("*, projects(name)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const badgesQuery = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      const client = createSupabaseClient();
      const { data: allBadges } = await client.from("badges").select("*");
      const { data: earnedBadges } = await client
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId!);
      const earnedIds = new Set(earnedBadges?.map((b) => b.badge_id) || []);
      return (allBadges || []).map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
    },
    enabled: !!userId,
  });

  const groupMembersQuery = useQuery({
    queryKey: ["group-members", userId],
    queryFn: async () => {
      // RLS ensures we only see same-group members
      const client = createSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("id, full_name, total_contributed, annual_goal, level")
        .order("total_contributed", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return { profileQuery, contributionsQuery, badgesQuery, groupMembersQuery };
};

export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const client = createSupabaseClient();
      const { data, error } = await client
        .from("projects")
        .select("*")
        .eq("status", "ongoing")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
