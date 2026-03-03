import { motion } from "framer-motion";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  amount: number;
  memberCount?: number;
  isHighlighted?: boolean;
}

const rankIcons: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const LeaderboardItem = ({ rank, name, amount, memberCount, isHighlighted }: LeaderboardItemProps) => {
  return (
    <motion.div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
        isHighlighted ? "gradient-gold glow-gold" : "glass-card-hover"
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-lg font-bold">
        {rankIcons[rank] || rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${isHighlighted ? "text-primary-foreground" : "text-foreground"}`}>
          {name}
        </p>
        {memberCount && (
          <p className={`text-xs ${isHighlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {memberCount} members
          </p>
        )}
      </div>
      <p className={`font-bold text-sm ${isHighlighted ? "text-primary-foreground" : "text-foreground"}`}>
        KES {amount.toLocaleString()}
      </p>
    </motion.div>
  );
};

export default LeaderboardItem;
