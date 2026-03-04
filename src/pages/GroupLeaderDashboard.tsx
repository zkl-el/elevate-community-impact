import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, Target, Loader2, Trophy } from "lucide-react";
import StatsCard from "@/components/church/StatsCard";
import ProgressRing from "@/components/church/ProgressRing";
import { useEffect } from "react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const GroupLeaderDashboard = () => {
  const { user, roles, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || (!roles.includes("group_leader") && !roles.includes("super_admin")))) navigate("/dashboard");
  }, [authLoading, user, roles, navigate]);

  const hasAccess = roles.includes("group_leader") || roles.includes("super_admin");

  const groupQ = useQuery({
    queryKey: ["leader-group", profile?.group_id],
    queryFn: async () => {
      if (!profile?.group_id) return null;
      const { data, error } = await supabase.from("groups").select("*").eq("id", profile.group_id).single();
      if (error) throw error;
      return data;
    },
    enabled: hasAccess && !!profile?.group_id,
  });

  const membersQ = useQuery({
    queryKey: ["leader-members", profile?.group_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, total_contributed, annual_goal, level, streak, category")
        .order("total_contributed", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: hasAccess,
  });

  const group = groupQ.data;
  const members = membersQ.data ?? [];
  const totalContributed = members.reduce((s, m) => s + Number(m.total_contributed), 0);
  const totalGoal = members.reduce((s, m) => s + Number(m.annual_goal), 0);
  const groupPct = totalGoal > 0 ? (totalContributed / totalGoal) * 100 : 0;

  if (authLoading || membersQ.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <motion.div className="container mx-auto px-4 py-6 space-y-6" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> {group?.name ?? "My Group"}
          </h1>
          <p className="text-sm text-muted-foreground">Group Leader Dashboard</p>
        </motion.div>

        {/* Group Stats */}
        <motion.div variants={item} className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing percentage={groupPct} size={140} strokeWidth={10} label="Group Progress" />
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <StatsCard title="Members" value={members.length} icon={<Users className="w-5 h-5 text-primary" />} />
            <StatsCard title="Contributed" value={`KES ${totalContributed.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
            <StatsCard title="Group Goal" value={`KES ${totalGoal.toLocaleString()}`} icon={<Target className="w-5 h-5 text-primary" />} />
            <StatsCard title="Avg Progress" value={`${groupPct.toFixed(0)}%`} icon={<Trophy className="w-5 h-5 text-primary" />} />
          </div>
        </motion.div>

        {/* Member Leaderboard */}
        <motion.div variants={item}>
          <h2 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Member Leaderboard
          </h2>
          <div className="space-y-2">
            {members.map((m, i) => {
              const pct = Number(m.annual_goal) > 0 ? Math.round((Number(m.total_contributed) / Number(m.annual_goal)) * 100) : 0;
              const rankIcons: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };
              return (
                <motion.div
                  key={m.id}
                  className={`glass-card flex items-center gap-4 p-4 rounded-xl ${i === 0 ? "border-primary/30 border-2" : ""}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                    {rankIcons[i] ?? i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.category.replace("_", " ")} • Level {m.level} • 🔥 {m.streak}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div className="h-full rounded-full gradient-gold" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">KES {Number(m.total_contributed).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">of {Number(m.annual_goal).toLocaleString()}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GroupLeaderDashboard;
