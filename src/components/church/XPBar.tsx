import { motion } from "framer-motion";
import { LEVELS } from "@/lib/mockData";

interface XPBarProps {
  currentXP: number;
  currentLevel: number;
}

const XPBar = ({ currentXP, currentLevel }: XPBarProps) => {
  const current = LEVELS[currentLevel - 1];
  const next = LEVELS[currentLevel] || { minXP: current.minXP + 5000, name: "Max Level", icon: "👑" };
  const progress = ((currentXP - current.minXP) / (next.minXP - current.minXP)) * 100;

  return (
    <motion.div
      className="glass-card p-4 rounded-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{current.icon}</span>
          <div>
            <p className="text-sm font-bold text-foreground">{current.name}</p>
            <p className="text-xs text-muted-foreground">Level {currentLevel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next: {next.name}</p>
            <p className="text-xs font-semibold text-xp-purple">{currentXP.toLocaleString()} XP</p>
          </div>
          <span className="text-lg opacity-40">{next.icon}</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full gradient-xp"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-right mt-1">
        {(next.minXP - currentXP).toLocaleString()} XP to next level
      </p>
    </motion.div>
  );
};

export default XPBar;
