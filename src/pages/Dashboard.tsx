import { useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Header from "@/components/church/Header";
import ProgressRing from "@/components/church/ProgressRing";
import StatsCard from "@/components/church/StatsCard";
import BadgeCard from "@/components/church/BadgeCard";
import XPBar from "@/components/church/XPBar";
import StreakBadge from "@/components/church/StreakBadge";
import XPPopup from "@/components/church/XPPopup";
import { MOCK_USER, BADGES, MOCK_CONTRIBUTIONS, MOCK_GROUP_MEMBERS } from "@/lib/mockData";
import { CalendarDays, Wallet, Target, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const user = MOCK_USER;
  const balance = user.annualGoal - user.totalContributed;
  const percentage = (user.totalContributed / user.annualGoal) * 100;
  const [showXP, setShowXP] = useState(false);

  const handleContribute = () => {
    setShowXP(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#d4a017", "#2d8a56", "#7c3aed"],
    });
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
      <XPPopup amount={150} show={showXP} onComplete={() => setShowXP(false)} />

      <motion.div
        className="container mx-auto px-4 py-6 space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Greeting */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-foreground">Hello, {user.fullName.split(" ")[0]} 👋</h1>
            <p className="text-sm text-muted-foreground">{user.groupName} • {user.category}</p>
          </div>
          <StreakBadge streak={user.streak} />
        </motion.div>

        {/* XP Bar */}
        <motion.div variants={item}>
          <XPBar currentXP={user.xp} currentLevel={user.level} />
        </motion.div>

        {/* Goal Progress */}
        <motion.div variants={item} className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing percentage={percentage} size={140} strokeWidth={10} label="Goal Progress" />
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <StatsCard title="Annual Goal" value={`KES ${user.annualGoal.toLocaleString()}`} icon={<Target className="w-5 h-5 text-primary" />} />
            <StatsCard title="Contributed" value={`KES ${user.totalContributed.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
            <StatsCard title="Remaining" value={`KES ${balance.toLocaleString()}`} icon={<Wallet className="w-5 h-5 text-bronze" />} />
            <StatsCard title="This Month" value="KES 2,000" icon={<CalendarDays className="w-5 h-5 text-xp-purple" />} />
          </div>
        </motion.div>

        {/* Contribute Button */}
        <motion.div variants={item}>
          <motion.button
            onClick={handleContribute}
            className="w-full h-16 rounded-2xl gradient-gold text-primary-foreground font-bold text-lg glow-gold flex items-center justify-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            💰 Make a Contribution
          </motion.button>
        </motion.div>

        {/* Badges */}
        <motion.div variants={item}>
          <h2 className="text-xl font-display text-foreground mb-4">Your Badges</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {BADGES.map((badge) => (
              <BadgeCard key={badge.id} {...badge} />
            ))}
          </div>
        </motion.div>

        {/* Contribution History */}
        <motion.div variants={item}>
          <h2 className="text-xl font-display text-foreground mb-4">Recent Contributions</h2>
          <div className="space-y-2">
            {MOCK_CONTRIBUTIONS.map((c) => (
              <motion.div
                key={c.id}
                className="glass-card-hover flex items-center justify-between p-4 rounded-xl"
                whileHover={{ scale: 1.01 }}
              >
                <div>
                  <p className="font-semibold text-foreground text-sm">KES {c.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{c.project} • {c.method}</p>
                </div>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Group Members */}
        <motion.div variants={item}>
          <h2 className="text-xl font-display text-foreground mb-4">Fellow Members — {user.groupName}</h2>
          <div className="space-y-2">
            {MOCK_GROUP_MEMBERS.map((m) => (
              <div key={m.id} className="glass-card flex items-center gap-4 p-4 rounded-xl">
                <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {m.fullName.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{m.fullName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full gradient-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${m.goalPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{m.goalPercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
