import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Heart, TrendingUp, Users, GraduationCap, Church, Eye, UserCheck, X, Trophy, Construction } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProgressRing from "@/components/church/ProgressRing";
import StatsCard from "@/components/church/StatsCard";
import LeaderboardItem from "@/components/church/LeaderboardItem";
import Header from "@/components/church/Header";
import { usePublicDashboard } from "@/hooks/useChurchData";

const ANNUAL_GOAL = 500000; // Configurable church annual goal

const CATEGORIES = [
  { id: "church_member", label: "Church Member", icon: Church, description: "Registered church member", requiresAuth: true },
  { id: "student", label: "Student", icon: GraduationCap, description: "Student member", requiresAuth: true },
  { id: "visitor", label: "Visitor", icon: Eye, description: "First-time or occasional visitor", requiresAuth: false },
  { id: "regular", label: "Regular", icon: UserCheck, description: "Regular attendee", requiresAuth: false },
];

const Index = () => {
  const { data, isLoading } = usePublicDashboard();
  const [showPicker, setShowPicker] = useState(false);
  const navigate = useNavigate();

  const totalCollected = data?.total_collected ?? 0;
  const percentage = ANNUAL_GOAL > 0 ? (totalCollected / ANNUAL_GOAL) * 100 : 0;
  const currentProject = data?.current_project;
  const projectPercentage = currentProject
    ? (currentProject.collected_amount / currentProject.target_amount) * 100
    : 0;
  const bestGroup = data?.best_group;
  const groups = data?.groups_leaderboard ?? [];
  const activeMembers = data?.active_members ?? 0;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gold"
              style={{
                width: 100 + i * 60,
                height: 100 + i * 60,
                top: `${20 + i * 10}%`,
                left: `${10 + i * 18}%`,
              }}
              animate={{ y: [0, -15, 0], opacity: [0.05, 0.15, 0.05] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <motion.div
          className="container mx-auto px-4 text-center relative z-10"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.p variants={item} className="text-gold-light text-sm font-semibold tracking-widest uppercase mb-3">
            Together We Build
          </motion.p>
          <motion.h1 variants={item} className="text-4xl sm:text-5xl lg:text-6xl font-display text-primary-foreground mb-4 leading-tight">
            Grace Community Church
          </motion.h1>
          <motion.p variants={item} className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto">
            Building God's kingdom through faithful giving, joyful hearts, and united purpose.
          </motion.p>

          <motion.div variants={item} className="flex justify-center mb-8">
            <ProgressRing percentage={percentage} size={200} strokeWidth={12} label="Annual Goal" sublabel={`KES ${ANNUAL_GOAL.toLocaleString()}`} />
          </motion.div>

          <motion.div variants={item} className="flex flex-col items-center gap-2 mb-10">
            <p className="text-3xl font-bold text-primary-foreground font-body">
              KES {totalCollected.toLocaleString()}
            </p>
            <p className="text-primary-foreground/60 text-sm">
              raised of KES {ANNUAL_GOAL.toLocaleString()} goal
            </p>
          </motion.div>

          <motion.div variants={item}>
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl gradient-gold text-primary-foreground font-bold text-lg shadow-lg transition-all hover:scale-105 hover:shadow-xl glow-gold"
            >
              <Heart className="w-5 h-5" />
              Press Here to Contribute
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <StatsCard
              title="Total Collected"
              value={`KES ${totalCollected.toLocaleString()}`}
              subtitle={`${percentage.toFixed(1)}% of annual goal`}
              icon={<TrendingUp className="w-6 h-6 text-accent" />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatsCard
              title="Best Group"
              value={bestGroup?.name ?? "—"}
              subtitle={bestGroup ? `KES ${bestGroup.total.toLocaleString()} • ${bestGroup.members} members` : "No groups yet"}
              icon={<Trophy className="w-6 h-6 text-primary" />}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatsCard
              title="Active Members"
              value={activeMembers}
              subtitle="Contributing this year"
              icon={<Users className="w-6 h-6 text-primary" />}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Current Project */}
      {currentProject && (
        <section className="container mx-auto px-4 py-16">
          <motion.div
            className="glass-card p-6 sm:p-8 rounded-3xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-1"><Construction className="w-3.5 h-3.5" /> Current Project</p>
                <h2 className="text-2xl sm:text-3xl font-display text-foreground mb-2">{currentProject.name}</h2>
                <p className="text-muted-foreground text-sm mb-4">{currentProject.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-foreground">KES {currentProject.collected_amount.toLocaleString()}</span>
                  <span className="text-muted-foreground">of KES {currentProject.target_amount.toLocaleString()}</span>
                </div>
                <div className="relative h-3 rounded-full bg-muted overflow-hidden mt-3 max-w-md">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full gradient-emerald glow-emerald"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${projectPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              <ProgressRing percentage={projectPercentage} size={120} strokeWidth={8} color="emerald" label="Funded" />
            </div>
          </motion.div>
        </section>
      )}

      {/* Group Leaderboard Preview */}
      {groups.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-display text-foreground mb-6 text-center">Group Leaderboard</h2>
            <div className="max-w-lg mx-auto space-y-3">
              {groups.slice(0, 5).map((group, i) => (
                <LeaderboardItem
                  key={group.id}
                  rank={i + 1}
                  name={group.name}
                  amount={group.total}
                  memberCount={group.member_count}
                  isHighlighted={i === 0}
                />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Category Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              className="bg-card border border-border rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display text-foreground">I am a...</h2>
                <button onClick={() => setShowPicker(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    onClick={() => {
                      setShowPicker(false);
                      if (cat.requiresAuth) {
                        navigate(`/auth?category=${cat.id}`);
                      } else {
                        navigate(`/guest-dashboard?category=${cat.id}`);
                      }
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <cat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Grace Community Church. Built with <Heart className="w-3.5 h-3.5 inline text-primary" /> and faith.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
