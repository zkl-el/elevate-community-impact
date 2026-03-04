import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, Shield, FolderKanban, Target, TrendingUp,
  Plus, Trash2, Edit, Loader2, UserCheck, ChevronDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import StatsCard from "@/components/church/StatsCard";
import { useEffect } from "react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const SuperAdminDashboard = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || !roles.includes("super_admin"))) navigate("/dashboard");
  }, [authLoading, user, roles, navigate]);

  // --- Queries ---
  const profilesQ = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*, groups!profiles_group_id_fkey(name)").order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: roles.includes("super_admin"),
  });

  const groupsQ = useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: roles.includes("super_admin"),
  });

  const projectsQ = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: roles.includes("super_admin"),
  });

  const rolesQ = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
    enabled: roles.includes("super_admin"),
  });

  const contributionsQ = useQuery({
    queryKey: ["admin-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contributions").select("*, projects(name)").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: roles.includes("super_admin"),
  });

  // --- State for forms ---
  const [newGroupName, setNewGroupName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTarget, setNewProjectTarget] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editGoal, setEditGoal] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editRole, setEditRole] = useState("");

  const profiles = profilesQ.data ?? [];
  const groups = groupsQ.data ?? [];
  const projects = projectsQ.data ?? [];
  const allRoles = rolesQ.data ?? [];
  const contributions = contributionsQ.data ?? [];

  const totalCollected = profiles.reduce((s, p) => s + Number(p.total_contributed), 0);
  const activeMembers = profiles.filter(p => Number(p.total_contributed) > 0).length;

  const getUserRoles = (uid: string) => allRoles.filter(r => r.user_id === uid).map(r => r.role);

  // --- Handlers ---
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const { error } = await supabase.from("groups").insert({ name: newGroupName.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Group created!");
    setNewGroupName("");
    qc.invalidateQueries({ queryKey: ["admin-groups"] });
  };

  const handleDeleteGroup = async (id: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Group deleted");
    qc.invalidateQueries({ queryKey: ["admin-groups"] });
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !newProjectTarget) return;
    const { error } = await supabase.from("projects").insert({
      name: newProjectName.trim(),
      target_amount: Number(newProjectTarget),
      description: newProjectDesc || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Project created!");
    setNewProjectName(""); setNewProjectTarget(""); setNewProjectDesc("");
    qc.invalidateQueries({ queryKey: ["admin-projects"] });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const updates: any = {};
    if (editGoal) updates.annual_goal = Number(editGoal);
    if (editGroupId) updates.group_id = editGroupId === "none" ? null : editGroupId;
    if (editCategory) updates.category = editCategory;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("profiles").update(updates).eq("id", editingUser.id);
      if (error) { toast.error(error.message); return; }
    }

    // Update role if changed
    if (editRole) {
      await supabase.from("user_roles").delete().eq("user_id", editingUser.id);
      await supabase.from("user_roles").insert({ user_id: editingUser.id, role: editRole as any });
    }

    toast.success("User updated!");
    setEditingUser(null);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
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
            <Shield className="w-6 h-6 text-primary" /> Super Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">Full system control</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard title="Total Members" value={profiles.length} icon={<Users className="w-5 h-5 text-primary" />} />
          <StatsCard title="Active Members" value={activeMembers} icon={<UserCheck className="w-5 h-5 text-accent" />} />
          <StatsCard title="Total Collected" value={`KES ${totalCollected.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-accent" />} />
          <StatsCard title="Groups" value={groups.length} icon={<FolderKanban className="w-5 h-5 text-primary" />} />
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl bg-muted">
              <TabsTrigger value="users" className="rounded-lg text-sm">Users</TabsTrigger>
              <TabsTrigger value="groups" className="rounded-lg text-sm">Groups</TabsTrigger>
              <TabsTrigger value="projects" className="rounded-lg text-sm">Projects</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg text-sm">Reports</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="mt-4 space-y-3">
              {profiles.map((p) => {
                const userRoles = getUserRoles(p.id);
                return (
                  <div key={p.id} className="glass-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(p as any).groups?.name ?? "No Group"} • {p.category.replace("_", " ")} • Level {p.level}
                      </p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {userRoles.map(r => (
                          <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{r.replace("_", " ")}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">KES {Number(p.total_contributed).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">of {Number(p.annual_goal).toLocaleString()}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => {
                            setEditingUser(p);
                            setEditGoal(String(p.annual_goal));
                            setEditGroupId(p.group_id ?? "none");
                            setEditCategory(p.category);
                            setEditRole(userRoles[0] ?? "member");
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {p.full_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <label className="text-sm text-muted-foreground">Annual Goal (KES)</label>
                            <Input type="number" value={editGoal} onChange={e => setEditGoal(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Group</label>
                            <Select value={editGroupId} onValueChange={setEditGroupId}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Group</SelectItem>
                                {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Category</label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="visitor">Visitor</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="church_member">Church Member</SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Role</label>
                            <Select value={editRole} onValueChange={setEditRole}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="group_leader">Group Leader</SelectItem>
                                <SelectItem value="finance_admin">Finance Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <motion.button
                            onClick={handleSaveUser}
                            className="w-full h-12 rounded-xl gradient-gold text-primary-foreground font-semibold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            Save Changes
                          </motion.button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                );
              })}
            </TabsContent>

            {/* GROUPS TAB */}
            <TabsContent value="groups" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New group name..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="flex-1"
                />
                <motion.button
                  onClick={handleAddGroup}
                  className="px-4 py-2 rounded-xl gradient-gold text-primary-foreground font-semibold flex items-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-4 h-4" /> Add
                </motion.button>
              </div>
              {groups.map(g => {
                const memberCount = profiles.filter(p => p.group_id === g.id).length;
                const groupTotal = profiles.filter(p => p.group_id === g.id).reduce((s, p) => s + Number(p.total_contributed), 0);
                return (
                  <div key={g.id} className="glass-card p-4 rounded-xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {g.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{memberCount} members • KES {groupTotal.toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteGroup(g.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                );
              })}
            </TabsContent>

            {/* PROJECTS TAB */}
            <TabsContent value="projects" className="mt-4 space-y-4">
              <div className="glass-card p-4 rounded-xl space-y-3">
                <p className="font-semibold text-foreground text-sm">Create New Project</p>
                <Input placeholder="Project name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                <Input placeholder="Target amount (KES)" type="number" value={newProjectTarget} onChange={e => setNewProjectTarget(e.target.value)} />
                <Input placeholder="Description (optional)" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
                <motion.button
                  onClick={handleAddProject}
                  className="w-full h-10 rounded-xl gradient-gold text-primary-foreground font-semibold flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus className="w-4 h-4" /> Create Project
                </motion.button>
              </div>
              {projects.map(p => {
                const pct = Number(p.target_amount) > 0 ? (Number(p.collected_amount) / Number(p.target_amount)) * 100 : 0;
                return (
                  <div key={p.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "ongoing" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mb-2">{p.description}</p>}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-foreground">KES {Number(p.collected_amount).toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {Number(p.target_amount).toLocaleString()}</span>
                      <span className="text-xs text-primary font-medium ml-auto">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
                      <motion.div className="h-full rounded-full gradient-emerald" initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* REPORTS TAB */}
            <TabsContent value="reports" className="mt-4 space-y-3">
              <h3 className="font-display text-lg text-foreground">Recent Contributions</h3>
              {contributions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No contributions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {contributions.map(c => (
                    <div key={c.id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">KES {Number(c.amount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{(c as any).projects?.name ?? "General Fund"} • {c.method}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SuperAdminDashboard;
