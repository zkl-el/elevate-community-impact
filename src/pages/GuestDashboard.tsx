import { motion } from "framer-motion";
import { useSearchParams, Link } from "react-router-dom";
import { Heart, TrendingUp, Users, ArrowLeft, Trophy, Construction } from "lucide-react";
import Header from "@/components/church/Header";
import ProgressRing from "@/components/church/ProgressRing";
import StatsCard from "@/components/church/StatsCard";
import LeaderboardItem from "@/components/church/LeaderboardItem";
import { usePublicDashboard, useProjects } from "@/hooks/useChurchData";

const ANNUAL_GOAL = 500000;

const GuestDashboard = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "visitor";
  const label = category === "regular" ? "Regular Attendee" : "Visitor";

  const { data } = usePublicDashboard();
  const { data: projects } = useProjects();

  const totalCollected = data?.total_collected ?? 0;
  const percentage = ANNUAL_GOAL > 0 ? (totalCollected / ANNUAL_GOAL) * 100 : 0;
  const bestGroup = data?.best_group;
  const groups = data?.groups_leaderboard ?? [];
  const currentProject = data?.current_project;
  const projectPercentage = currentProject
    ? (currentProject.collected_amount / currentProject.target_amount) * 100
    : 0;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <motion.div className="container mx-auto px-4 py-6 space-y-6" variants={container} initial="hidden" animate="show">
        {/* Greeting */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">Welcome, {label}!</h1>
            <p className="text-sm text-muted-foreground">Thank you for joining us today</p>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </motion.div>

        {/* Church Progress */}
        <motion.div variants={item} className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing percentage={percentage} size={140} strokeWidth={10} label="Annual Goal" />
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <StatsCard title="Total Collected" value={`KES ${totalCollected.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
            <StatsCard title="Annual Goal" value={`KES ${ANNUAL_GOAL.toLocaleString()}`} icon={<Heart className="w-5 h-5 text-primary" />} />
            <StatsCard title="Best Group" value={bestGroup?.name ?? "—"} icon={<Trophy className="w-5 h-5 text-primary" />} />
            <StatsCard title="Active Members" value={data?.active_members ?? 0} icon={<Users className="w-5 h-5 text-primary" />} />
          </div>
        </motion.div>

        {/* Current Project */}
        {currentProject && (
          <motion.div variants={item} className="glass-card p-6 rounded-3xl">
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 flex items-center gap-1"><Construction className="w-3.5 h-3.5" /> Current Project</p>
            <h2 className="text-xl font-display text-foreground mb-2">{currentProject.name}</h2>
            <p className="text-muted-foreground text-sm mb-4">{currentProject.description}</p>
            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="font-bold text-foreground">KES {currentProject.collected_amount.toLocaleString()}</span>
              <span className="text-muted-foreground">of KES {currentProject.target_amount.toLocaleString()}</span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden max-w-md">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full gradient-emerald glow-emerald"
                initial={{ width: 0 }}
                animate={{ width: `${projectPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Groups */}
        {groups.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-xl font-display text-foreground mb-4">Group Leaderboard</h2>
            <div className="space-y-3">
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
        )}

        {/* CTA to become a member */}
        <motion.div variants={item} className="glass-card p-6 rounded-3xl text-center">
          <h3 className="text-lg font-display text-foreground mb-2">Want to contribute?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create an account as a Church Member or Student to start contributing and track your progress.
          </p>
          <Link
            to="/auth?category=church_member"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-gold text-primary-foreground font-semibold transition-transform hover:scale-105"
          >
            <Heart className="w-4 h-4" />
            Sign Up to Contribute
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GuestDashboard;
