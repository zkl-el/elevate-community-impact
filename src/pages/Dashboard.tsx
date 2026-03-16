import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useMemberDashboard, usePublicDashboard } from "@/hooks/useChurchData";
import { supabase } from "@/lib/supabase";
import { LEVELS } from "@/lib/mockData";
import Header from "@/components/church/Header";
import { cn } from "@/lib/utils";

// Dashboard Components
import OverviewCard from "@/components/dashboard/OverviewCard";
import ActionButtonsGrid, { actions } from "@/components/dashboard/ActionButtonsGrid";
import PledgeGoalForm from "@/components/dashboard/PledgeGoalForm";

// Icons
import { 
  Wallet, 
  Target, 
  FileText, 
  Users, 
  FolderKanban, 
  BarChart3,
  Bell,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

const LEVEL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Sprout: LucideIcons.Sprout,
  Leaf: LucideIcons.Leaf,
  Hammer: LucideIcons.Hammer,
  Church: LucideIcons.Church,
  Crown: LucideIcons.Crown,
};

const LevelIcon = ({ name }: { name: string }) => {
  const Icon = LEVEL_ICONS[name] || LucideIcons.Sprout;
  return <Icon className="w-5 h-5 text-primary" />;
};



// Full Payment Form (from GuestDashboard)
const PaymentForm = ({ userId, isSimulated }: { userId?: string; isSimulated: boolean }) => {
  const [paymentType, setPaymentType] = useState<"mobile_money" | "bank_transfer">("mobile_money");
  const [phone, setPhone] = useState("");
  const [selectedMobileMethod, setSelectedMobileMethod] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentState, setPaymentState] = useState<"form" | "success" | "error">("form");

  const mobileMoneyMethods = [
    { id: "mpesa", name: "M-Pesa" },
    { id: "tigopesa", name: "Tigo Pesa" },
    { id: "airtel", name: "Airtel Money" },
    { id: "halopesa", name: "HaloPesa" },
  ];

  const bankMethods = [
    { id: "crdb", name: "CRDB Bank", accountNumber: "02XXXXXXXXXXXX" },
    { id: "nmb", name: "NMB Bank", accountNumber: "XXXXXXXXXX" },
    { id: "nbc", name: "NBC Bank", accountNumber: "XXXXXXXXXXXX" },
  ];

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  };

  const formatCurrency = (amt: number): string => amt.toLocaleString("en-TZ");

  const handleSubmit = async () => {
    const numericAmount = parseInt(amount, 10);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (paymentType === "mobile_money") {
      const cleanPhone = phone.replace(/\s/g, "");
      if (cleanPhone.length !== 12) {
        toast.error("Enter a valid phone number (2557XXXXXXXX)");
        return;
      }
      if (!selectedMobileMethod) {
        toast.error("Please select a mobile money provider");
        return;
      }
    } else {
      if (!selectedBank || !accountNumber.trim()) {
        toast.error("Please select a bank and enter account number");
        return;
      }
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (isSimulated || userId) {
      setPaymentState("success");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#d4a017", "#2d8a56", "#7c3aed"],
      });
      toast.success(isSimulated ? "Contribution recorded! (Demo Mode)" : "Contribution recorded!");
      
      if (!isSimulated && userId) {
        await supabase.from("contributions").insert({
          user_id: userId,
          amount: numericAmount,
          method: paymentType === "mobile_money" ? "mobile_money" : "bank_transfer",
        });
      }
    } else {
      setPaymentState("error");
      toast.error("Failed to process contribution");
    }

    setIsProcessing(false);
  };

  if (paymentState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-2xl font-display text-white mb-2">
          {paymentType === "mobile_money" ? "Contribution Initiated!" : "Bank Transfer Details!"}
        </h2>
        <p className="text-sm text-white/70 mb-6">
          {paymentType === "mobile_money" 
            ? "A payment request has been sent to your phone." 
            : "Please use the bank details below to make your transfer."}
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 text-left border border-white/10">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Amount</span>
              <span className="font-semibold text-gold-light text-lg">
                TZS {formatCurrency(parseInt(amount, 10) || 0)}
              </span>
            </div>
          </div>
        <motion.button
          onClick={() => { setPaymentState("form"); setAmount(""); setPhone(""); setReference(""); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-6 rounded-xl gradient-gold text-primary-foreground font-semibold transition-all shadow-lg"
        >
          Make Another Contribution
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Type Tabs */}
      <div className="flex rounded-xl bg-white/10 p-1 border border-white/10">
        <button
          type="button"
          onClick={() => setPaymentType("mobile_money")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            paymentType === "mobile_money" 
              ? "bg-white text-primary shadow-md" 
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          Mobile Money
        </button>
        <button
          type="button"
          onClick={() => setPaymentType("bank_transfer")}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            paymentType === "bank_transfer" 
              ? "bg-white text-primary shadow-md" 
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          Bank Transfer
        </button>
      </div>

      {/* Mobile Money Fields */}
      {paymentType === "mobile_money" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              placeholder="2557XXXXXXXX"
              className="w-full h-11 px-4 rounded-xl border-2 bg-white/95 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-gold"
              maxLength={16}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Reference Note <span className="text-white/40 font-normal">(Optional)</span></label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., Tithe, Offering"
              className="w-full h-11 px-4 rounded-xl border-2 bg-white/95 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-gold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Mobile Money Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {mobileMoneyMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMobileMethod(method.id)}
                  className={`relative p-2 rounded-lg border-2 text-center transition-all ${
                    selectedMobileMethod === method.id
                      ? "border-gold bg-gold/10"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <span className="font-medium text-white text-xs">{method.name}</span>
                  {selectedMobileMethod === method.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                      <CheckCircle2 className="w-2 h-2 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Fields */}
      {paymentType === "bank_transfer" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Select Bank</label>
            <div className="grid grid-cols-1 gap-2">
              {bankMethods.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => setSelectedBank(bank.id)}
                  className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                    selectedBank === bank.id
                      ? "border-gold bg-gold/10"
                      : "border-white/20 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <span className="font-semibold text-white text-sm block">{bank.name}</span>
                  <span className="text-xs text-white/50">Acc: {bank.accountNumber}</span>
                  {selectedBank === bank.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
                      <CheckCircle2 className="w-2 h-2 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-white">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter your account number"
              className="w-full h-11 px-4 rounded-xl border-2 bg-white/95 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-gold"
            />
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-white">Amount (TZS)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-medium">TZS</span>
          <input
            type="text"
            value={amount ? formatCurrency(parseInt(amount) || 0) : ""}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0"
            className="w-full h-11 pl-16 pr-4 rounded-xl border-2 bg-white/95 text-base font-medium focus:outline-none focus:ring-2 focus:ring-white/20 border-border/50 focus:border-gold"
          />
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={isProcessing}
        whileHover={!isProcessing ? { scale: 1.01 } : {}}
        whileTap={!isProcessing ? { scale: 0.99 } : {}}
        className={`w-full h-12 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          isProcessing
            ? "bg-white/20 text-white/50 cursor-not-allowed"
            : "gradient-gold text-primary-foreground shadow-lg hover:shadow-xl"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Contribute Now"
        )}
      </motion.button>


    </div>
  );
};

const ContributionsList = ({ contributions }: { contributions: any[] }) => {
  if (contributions.length === 0) {
    return (
      <div className="text-center py-8">
        <Wallet className="w-12 h-12 mx-auto text-white/30 mb-3" />
        <p className="text-white/70">No contributions yet</p>
        <p className="text-sm text-white/50">Start contributing to see your history here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contributions.slice(0, 10).map((contribution: any) => (
        <motion.div
          key={contribution.id}
          className="flex items-center justify-between p-3 rounded-xl bg-white/5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-white">
                TZS {contribution.amount?.toLocaleString() || "0"}
              </p>
              <p className="text-xs text-white/50">
                {(contribution as any).projects?.name || "General Fund"} • {contribution.method || "Demo"}
              </p>
            </div>
            <p className="text-sm text-white/50">
              {contribution.created_at ? new Date(contribution.created_at).toLocaleDateString() : "Today"}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const GroupMembersList = ({ members, groupName }: { members: any[]; groupName: string }) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto text-white/30 mb-3" />
        <p className="text-white/70">No group members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">{groupName}</h4>
        <span className="text-sm text-white/50">{members.length} members</span>
      </div>
      {members.slice(0, 10).map((member: any) => {
        const goalPercent = member.annual_goal > 0 
          ? Math.round((member.total_contributed / member.annual_goal) * 100) 
          : 0;
        return (
          <motion.div
            key={member.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
              {member.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white truncate">{member.full_name}</p>
                <span className="text-xs font-medium text-amber-400">{goalPercent}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full gradient-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercent}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const ProjectsList = ({ projects }: { projects: any[] }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderKanban className="w-12 h-12 mx-auto text-white/30 mb-3" />
        <p className="text-white/70">No active projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project: any) => {
        const progress = project.target_amount > 0 
          ? (project.collected_amount / project.target_amount) * 100 
          : 0;
        return (
          <motion.div
            key={project.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white">{project.name}</h4>
                {project.description && (
                  <p className="text-sm text-white/50 mt-1">{project.description}</p>
                )}
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                {project.status || "Ongoing"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Progress</span>
                <span className="font-medium text-white">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/50">
                <span>TZS {project.collected_amount?.toLocaleString() || 0}</span>
                <span>TZS {project.target_amount?.toLocaleString() || 0}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const ReportsSection = ({ profile, contributions }: { profile: any; contributions: any[] }) => {
  const totalContributed = contributions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const contributionCount = contributions.length;
  const avgContribution = contributionCount > 0 ? totalContributed / contributionCount : 0;

  const stats = [
    { label: "Total Contributed", value: `TZS ${totalContributed.toLocaleString()}` },
    { label: "Contributions Made", value: contributionCount.toString() },
    { label: "Average Contribution", value: `TZS ${Math.round(avgContribution).toLocaleString()}` },
    { label: "Annual Goal", value: `TZS ${profile?.annual_goal?.toLocaleString() || 0}` },
    { label: "Goal Progress", value: `${profile?.annual_goal > 0 ? Math.round((profile.total_contributed / profile.annual_goal) * 100) : 0}%` },
    { label: "Current Level", value: LEVELS[profile?.level - 1]?.name || "Seed Sower" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="p-4 rounded-xl bg-white/5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <p className="text-xs text-white/50 mb-1">{stat.label}</p>
          <p className="text-lg font-bold text-white">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user, loading: authLoading, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  
  const [activePanel, setActivePanel] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user && !localStorage.getItem("user")) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  const queryUserId = user?.id;
  const { profileQuery, contributionsQuery, groupMembersQuery } = useMemberDashboard(queryUserId);
  const { data: publicData, isLoading: publicLoading, error: publicError } = usePublicDashboard();


  if (authLoading || profileQuery.isLoading || contributionsQuery.isLoading || publicLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileQuery.error || contributionsQuery.error || publicError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load your dashboard data. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const profile = authProfile || profileQuery.data;
  const contributions = contributionsQuery.data ?? [];
  const groupMembers = groupMembersQuery.data ?? [];
  const groupName = profile?.groups?.name || "My Group";

  // Use real data only - no mock fallbacks
  const churchGoal = publicData?.current_project?.target_amount || 0;
  const churchCollected = publicData?.current_project?.collected_amount || 0;
  const bestGroup = publicData?.best_group;
  const projects = publicData?.current_project ? [publicData.current_project] : [];

  const balance = profile?.annual_goal ? Math.max(0, profile.annual_goal - (profile.total_contributed || 0)) : 0;
  const groupProgress = groupMembers.length > 0
    ? groupMembers.reduce((sum: number, m: any) => sum + (m.annual_goal > 0 ? (m.total_contributed / m.annual_goal) * 100 : 0), 0) / groupMembers.length
    : 0;


  const handleAction = (actionId: string) => {
    setActivePanel(prev => prev === actionId ? null : actionId);
  };

  const closeDropdown = () => {
    setActivePanel(null);
  };

  const getDropdownContent = () => {
    switch (activePanel) {
      case "contribute":
        return (
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3a5c 100%)" }}>
            <PaymentForm userId={user?.id} isSimulated={false} />
          </div>
        );

      case "pledge":
        return <PledgeGoalForm userId={user?.id} />;
      case "my-contributions":
        return (
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3a5c 100%)" }}>
            <ContributionsList contributions={contributions} />
          </div>
        );
      case "group-members":
        return (
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3a5c 100%)" }}>
            <GroupMembersList members={groupMembers} groupName={groupName} />

          </div>
        );
      case "projects":
        return (
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3a5c 100%)" }}>
            <ProjectsList projects={projects} />
          </div>
        );
      case "reports":
        return <ReportsSection profile={profile} contributions={contributions} />;
      default:
        return null;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <motion.div
        className="container mx-auto px-4 py-6 space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold">
              {profile?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
            </div>
            <div>
              <h1 className="text-xl font-display text-foreground">
                Hello, {profile?.full_name?.split(" ")[0] || "User"}
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {profile?.category?.replace("_", " ") || "Church Member"}
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </motion.div>

        <motion.div variants={item}>
        <OverviewCard
          churchGoal={churchGoal}
          churchCollected={churchCollected}
          bestGroup={(bestGroup as any) ? {
            name: (bestGroup as any).name || "Unknown Group",
            total: (bestGroup as any).total || (bestGroup as any).totalContributed || 0,
          } : null}
          myRemainingGoal={balance}
        />

        </motion.div>

        <motion.div variants={item}>
          <ActionButtonsGrid
            onAction={handleAction}
            activeAction={activePanel}
            onCloseDropdown={closeDropdown}
          />
        </motion.div>

        {/* modal overlay for selected action */}
        <AnimatePresence>
          {activePanel && getDropdownContent() && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              onClick={closeDropdown}
            >
              <motion.div
                className="relative w-[90vw] sm:w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3a5c 100%)" }}
              >
                <div className="p-4">
                  {actions.find(a => a.id === activePanel) && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", actions.find(a => a.id === activePanel)!.color)}>
                        {actions.find(a => a.id === activePanel)!.icon}
                      </div>
                      <span className="font-medium text-white text-lg">
                        {actions.find(a => a.id === activePanel)!.label}
                      </span>
                    </div>
                  )}
                  {getDropdownContent()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Dashboard;
