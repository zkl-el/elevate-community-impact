import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useMemberDashboard } from "@/hooks/useChurchData";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import ProgressRing from "@/components/church/ProgressRing";
import StatsCard from "@/components/church/StatsCard";
import BadgeCard from "@/components/church/BadgeCard";
import XPBar from "@/components/church/XPBar";
import StreakBadge from "@/components/church/StreakBadge";
import XPPopup from "@/components/church/XPPopup";
import { LEVELS } from "@/lib/mockData";
import { CalendarDays, Wallet, Target, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showXP, setShowXP] = useState(false);
  const [contributing, setContributing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { profileQuery, contributionsQuery, badgesQuery, groupMembersQuery } = useMemberDashboard(user?.id);

  const p = profileQuery.data;
  const contributions = contributionsQuery.data ?? [];
  const badges = badgesQuery.data ?? [];
  const groupMembers = groupMembersQuery.data ?? [];

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No profile found. Please contact an admin.</p>
      </div>
    );
  }

  const balance = p.annual_goal - p.total_contributed;
  const percentage = p.annual_goal > 0 ? (p.total_contributed / p.annual_goal) * 100 : 0;
  const groupName = (p as any).groups?.name ?? "No Group";

  const handleContribute = async () => {
    setContributing(true);
    // Demo contribution of 500
    const { error } = await supabase.from("contributions").insert({
      user_id: user!.id,
      amount: 500,
      method: "demo",
    });
    setContributing(false);
    if (error) {
      toast.error("Contribution failed: " + error.message);
      return;
    }
    setShowXP(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d4a017", "#2d8a56", "#7c3aed"],
    });
    toast.success("Contribution recorded! 🎉");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["contributions"] });
    queryClient.invalidateQueries({ queryKey: ["user-badges"] });
    queryClient.invalidateQueries({ queryKey: ["public-dashboard"] });
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <XPPopup amount={50} show={showXP} onComplete={() => setShowXP(false)} />

      <motion.div
        className="container mx-auto px-4 py-6 space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Greeting */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">Hello, {p.full_name.split(" ")[0]} 👋</h1>
            <p className="text-sm text-muted-foreground">{groupName} • {p.category.replace("_", " ")}</p>
          </div>
          <StreakBadge streak={p.streak} />
        </motion.div>

        {/* XP Bar */}
        <motion.div variants={item}>
          <XPBar currentXP={p.xp} currentLevel={p.level} />
        </motion.div>

        {/* Goal Progress */}
        <motion.div variants={item} className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing percentage={percentage} size={140} strokeWidth={10} label="Goal Progress" />
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <StatsCard title="Annual Goal" value={`KES ${p.annual_goal.toLocaleString()}`} icon={<Target className="w-5 h-5 text-primary" />} />
            <StatsCard title="Contributed" value={`KES ${p.total_contributed.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
            <StatsCard title="Remaining" value={`KES ${Math.max(0, balance).toLocaleString()}`} icon={<Wallet className="w-5 h-5 text-bronze" />} />
            <StatsCard title="Level" value={LEVELS[p.level - 1]?.name ?? `Level ${p.level}`} icon={<span>{LEVELS[p.level - 1]?.icon ?? "🌱"}</span>} />
          </div>
        </motion.div>

        {/* Contribute Button */}
        <motion.div variants={item}>
          <motion.button
            onClick={handleContribute}
            disabled={contributing}
            className="w-full h-16 rounded-2xl gradient-gold text-primary-foreground font-bold text-lg glow-gold flex items-center justify-center gap-3 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {contributing ? <Loader2 className="w-5 h-5 animate-spin" /> : "💰"} Make a Contribution
          </motion.button>
        </motion.div>

        {/* Badges */}
        {badges.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-xl font-display text-foreground mb-4">Your Badges</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {badges.map((badge) => (
                <BadgeCard key={badge.id} icon={badge.icon} name={badge.name} description={badge.description ?? ""} earned={badge.earned} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Contribution History */}
        <motion.div variants={item}>
          <h2 className="text-xl font-display text-foreground mb-4">Recent Contributions</h2>
          {contributions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No contributions yet. Make your first one above! 🌱</p>
          ) : (
            <div className="space-y-2">
              {contributions.map((c) => (
                <motion.div key={c.id} className="glass-card-hover flex items-center justify-between p-4 rounded-xl" whileHover={{ scale: 1.01 }}>
                  <div>
                    <p className="font-semibold text-foreground text-sm">KES {c.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{(c as any).projects?.name ?? "General Fund"} • {c.method}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Group Members */}
        {groupMembers.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-xl font-display text-foreground mb-4">Fellow Members — {groupName}</h2>
            <div className="space-y-2">
              {groupMembers.map((m) => {
                const goalPercent = m.annual_goal > 0 ? Math.round((m.total_contributed / m.annual_goal) * 100) : 0;
                return (
                  <div key={m.id} className="glass-card flex items-center gap-4 p-4 rounded-xl">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {m.full_name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{m.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full rounded-full gradient-gold" initial={{ width: 0 }} animate={{ width: `${goalPercent}%` }} transition={{ duration: 1 }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{goalPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
