import { motion } from "framer-motion";

interface BadgeCardProps {
  icon: string;
  name: string;
  description: string;
  earned: boolean;
}

const BadgeCard = ({ icon, name, description, earned }: BadgeCardProps) => {
  return (
    <motion.div
      className={`relative flex flex-col items-center p-4 rounded-2xl text-center transition-all duration-300 ${
        earned
          ? "glass-card-hover"
          : "bg-muted/50 opacity-50 grayscale"
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: earned ? 1 : 0.5, scale: 1 }}
      whileHover={earned ? { scale: 1.05 } : undefined}
    >
      {earned && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px]">
          ✓
        </div>
      )}
      <span className="text-3xl mb-2">{icon}</span>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </motion.div>
  );
};

export default BadgeCard;
