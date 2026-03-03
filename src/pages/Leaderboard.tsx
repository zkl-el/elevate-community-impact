import { motion } from "framer-motion";
import Header from "@/components/church/Header";
import LeaderboardItem from "@/components/church/LeaderboardItem";
import { MOCK_GROUPS } from "@/lib/mockData";
import { Trophy } from "lucide-react";

const Leaderboard = () => {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const total = MOCK_GROUPS.reduce((sum, g) => sum + g.totalContributed, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <motion.div
        className="container mx-auto px-4 py-8 max-w-2xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold glow-gold mb-4"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-display text-foreground">Group Leaderboard</h1>
          <p className="text-muted-foreground mt-2">
            Total raised: <span className="font-bold text-foreground">KES {total.toLocaleString()}</span>
          </p>
        </motion.div>

        <motion.div variants={item} className="space-y-3">
          {MOCK_GROUPS.map((group, i) => (
            <LeaderboardItem
              key={group.id}
              rank={i + 1}
              name={group.name}
              amount={group.totalContributed}
              memberCount={group.memberCount}
              isHighlighted={i === 0}
            />
          ))}
        </motion.div>

        <motion.p variants={item} className="text-center text-sm text-muted-foreground mt-8">
          Keep contributing to help your group climb the leaderboard! 🚀
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
