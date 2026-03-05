import { motion } from "framer-motion";
import { Medal, Award, Trophy } from "lucide-react";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  amount: number;
  memberCount?: number;
  isHighlighted?: boolean;
}

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="w-5 h-5 text-primary" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-5 h-5 text-accent" />;
  return <span className="text-sm font-bold text-muted-foreground">{rank}</span>;
};

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
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
        <RankIcon rank={rank} />
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
