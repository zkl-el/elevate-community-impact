import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/church/Header";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";

const Auth = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const formatPhone = (input: string) => {
    let cleaned = input.replace(/[^\d+]/g, "");
    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("0")) cleaned = "+254" + cleaned.slice(1);
      else if (cleaned.startsWith("254")) cleaned = "+" + cleaned;
      else cleaned = "+254" + cleaned;
    }
    return cleaned;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatPhone(phone);
    if (formatted.length < 12) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPhone(formatted);
    setStep("otp");
    toast.success("OTP sent to " + formatted);
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome! 🎉");
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
            <Phone className="w-7 h-7 text-primary-foreground" />
          </motion.div>

          <h1 className="text-2xl font-display text-foreground mb-2">
            {step === "phone" ? "Welcome Back" : "Verify Your Number"}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {step === "phone"
              ? "Enter your phone number to sign in"
              : `We sent a code to ${phone}`}
          </p>

          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <Input
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-center text-lg h-14 rounded-xl border-border bg-background"
              />
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-xl gradient-gold text-primary-foreground font-semibold text-lg transition-transform disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Sending..." : "Send OTP"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl rounded-xl border-border" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <motion.button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full h-14 rounded-xl gradient-gold text-primary-foreground font-semibold text-lg transition-transform disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </motion.button>
              <button
                onClick={() => setStep("phone")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Change number
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
