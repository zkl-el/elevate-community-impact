import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DollarSign, TrendingUp, FileText, Plus, Loader2, Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/church/StatsCard";
import { useEffect } from "react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const FinanceAdminDashboard = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || (!roles.includes("finance_admin") && !roles.includes("super_admin")))) navigate("/dashboard");
  }, [authLoading, user, roles, navigate]);

  const hasAccess = roles.includes("finance_admin") || roles.includes("super_admin");

  const profilesQ = useQuery({
    queryKey: ["finance-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, total_contributed, annual_goal").order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: hasAccess,
  });

  const contributionsQ = useQuery({
    queryKey: ["finance-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contributions").select("*, projects(name)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: hasAccess,
  });

  const projectsQ = useQuery({
    queryKey: ["finance-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: hasAccess,
  });

  // Manual payment form
  const [payUserId, setPayUserId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("manual");
  const [payProjectId, setPayProjectId] = useState("");
  const [recording, setRecording] = useState(false);

  const profiles = profilesQ.data ?? [];
  const contributions = contributionsQ.data ?? [];
  const projects = projectsQ.data ?? [];
  const totalCollected = contributions.reduce((s, c) => s + Number(c.amount), 0);

  const handleRecordPayment = async () => {
    if (!payUserId || !payAmount || Number(payAmount) <= 0) {
      toast.error("Select a member and enter a valid amount");
      return;
    }
    setRecording(true);
    const { error } = await supabase.from("contributions").insert({
      user_id: payUserId,
      amount: Number(payAmount),
      method: payMethod,
      project_id: payProjectId || null,
      recorded_by: user!.id,
    });
    setRecording(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Payment recorded!");
    setPayAmount("");
    qc.invalidateQueries({ queryKey: ["finance-contributions"] });
    qc.invalidateQueries({ queryKey: ["finance-profiles"] });
  };

  if (authLoading || profilesQ.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <motion.div className="container mx-auto px-4 py-6 space-y-6" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <h1 className="text-2xl font-display text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" /> Finance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage contributions & financial reports</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatsCard title="Total Contributions" value={contributions.length} icon={<Receipt className="w-5 h-5 text-primary" />} />
          <StatsCard title="Amount Collected" value={`KES ${totalCollected.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
          <StatsCard title="Active Projects" value={projects.filter(p => p.status === "ongoing").length} icon={<FileText className="w-5 h-5 text-primary" />} />
        </motion.div>

        <motion.div variants={item}>
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-12 rounded-xl bg-muted">
              <TabsTrigger value="record" className="rounded-lg text-sm">Record Payment</TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg text-sm">History</TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="mt-4">
              <div className="glass-card p-6 rounded-xl space-y-4">
                <h3 className="font-display text-lg text-foreground">Record Manual Payment</h3>
                <div>
                  <label className="text-sm text-muted-foreground">Member</label>
                  <Select value={payUserId} onValueChange={setPayUserId}>
                    <SelectTrigger><SelectValue placeholder="Select member..." /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Amount (KES)</label>
                  <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="e.g. 5000" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Method</label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual / Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Project (optional)</label>
                  <Select value={payProjectId} onValueChange={setPayProjectId}>
                    <SelectTrigger><SelectValue placeholder="General Fund" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">General Fund</SelectItem>
                      {projects.filter(p => p.status === "ongoing").map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <motion.button
                  onClick={handleRecordPayment}
                  disabled={recording}
                  className="w-full h-12 rounded-xl gradient-gold text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Record Payment
                </motion.button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-2">
              {contributions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No contributions yet.</p>
              ) : contributions.map(c => (
                <div key={c.id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">KES {Number(c.amount).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {(c as any).projects?.name ?? "General Fund"} • {c.method}
                      {c.recorded_by ? " • Manual entry" : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FinanceAdminDashboard;
