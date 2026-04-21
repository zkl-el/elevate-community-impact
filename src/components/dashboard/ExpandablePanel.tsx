import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface ExpandablePanelProps {
  id: string;
  title: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: "default" | "gradient";
}

const ExpandablePanel = ({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
  variant = "default",
}: ExpandablePanelProps) => {
  return (
    <motion.div
      className={cn(
        "overflow-hidden rounded-2xl border",
        variant === "gradient" 
          ? "border-white/20 bg-white/5" 
          : "border-border/50 bg-card"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors",
          variant === "gradient"
            ? "hover:bg-white/5 text-white"
            : "hover:bg-accent text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            variant === "gradient"
              ? "bg-white/10 text-white"
              : "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
          <span className="font-semibold">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </motion.div>
      </button>

      {/* Content - Expandable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={cn(
              "px-4 pb-4",
              variant === "gradient" ? "text-white" : "text-foreground"
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExpandablePanel;

