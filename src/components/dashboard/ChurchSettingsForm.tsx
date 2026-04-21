import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Loader2, Save, Trophy } from "lucide-react";
import {
  useChurchSettings,
  useGroupsList,
  useUpdateChurchSettings,
} from "@/hooks/useChurchSettings";

const ChurchSettingsForm = () => {
  const settingsQuery = useChurchSettings();
  const groupsQuery = useGroupsList();
  const updateMutation = useUpdateChurchSettings();

  const [annualGoal, setAnnualGoal] = useState("");
  const [bestGroupId, setBestGroupId] = useState<string>("");

  useEffect(() => {
    if (settingsQuery.data) {
      setAnnualGoal(String(settingsQuery.data.annual_goal ?? ""));
      setBestGroupId(settingsQuery.data.best_group_id ?? "");
    }
  }, [settingsQuery.data]);

  const formatCurrency = (n: number) => n.toLocaleString("en-TZ");

  const handleSubmit = () => {
    const num = parseInt(annualGoal || "0", 10);
    if (num < 0) return;
    updateMutation.mutate({
      annual_goal: num,
      best_group_id: bestGroupId || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white">
        <Settings className="w-5 h-5" />
        <h3 className="font-semibold">Church Settings ({new Date().getFullYear()})</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white">
          Church Annual Goal (TZS)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            TZS
          </span>
          <input
            type="text"
            value={annualGoal ? formatCurrency(parseInt(annualGoal) || 0) : ""}
            onChange={(e) => setAnnualGoal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            className="w-full h-10 pl-12 pr-3 rounded-lg border-2 bg-white/95 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-amber-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white flex items-center gap-1">
          <Trophy className="w-4 h-4 text-amber-400" />
          Best Performing Group
        </label>
        <select
          value={bestGroupId}
          onChange={(e) => setBestGroupId(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border-2 bg-white/95 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-amber-400"
        >
          <option value="">— None selected —</option>
          {(groupsQuery.data ?? []).map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {(groupsQuery.data ?? []).length === 0 && !groupsQuery.isLoading && (
          <p className="text-xs text-white/50">
            No groups exist yet. Create groups first to feature them here.
          </p>
        )}
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={updateMutation.isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/40 text-amber-100 font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Settings
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ChurchSettingsForm;
