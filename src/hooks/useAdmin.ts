import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/database";

/**
 * Returns true when the current session user has the `admin` or
 * `super_admin` role in the `user_roles` table.
 */
export const useIsAdmin = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async (): Promise<boolean> => {
      if (!userId) return false;
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "super_admin"]);
      if (error) {
        console.warn("useIsAdmin error:", error.message);
        return false;
      }
      return (data?.length ?? 0) > 0;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
};
