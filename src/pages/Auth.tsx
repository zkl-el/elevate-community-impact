import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  church_member: "Church Member",
  student: "Student",
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "church_member";
  const categoryLabel = CATEGORY_LABELS[category] ?? "Church Member";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, category } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Welcome!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <motion.div
          className="glass-card w-full max-w-md p-8 rounded-3xl text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Mail className="w-7 h-7 text-primary-foreground" />
          </motion.div>

          <h1 className="text-2xl font-display text-foreground mb-1">
            {mode === "login" ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="text-xs font-semibold text-primary mb-1">Signing in as {categoryLabel}</p>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "login" ? "Sign in to your account" : "Create your account to get started"}
          </p>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
            {mode === "signup" && (
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-center text-lg h-14 rounded-xl border-border bg-background"
              />
            )}
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center text-lg h-14 rounded-xl border-border bg-background"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center text-lg h-14 rounded-xl border-border bg-background"
            />
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-xl gradient-gold text-primary-foreground font-semibold text-lg transition-transform disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </motion.button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
          >
            {mode === "login" ? (
              <>
                <UserPlus className="w-4 h-4" /> Don't have an account? Sign up
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Already have an account? Sign in
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
