import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/church/Header";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Auth = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 9) setStep("otp");
  };

  const handleVerifyOTP = () => {
    if (otp.length === 6) navigate("/dashboard");
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
                className="w-full flex items-center justify-center gap-2 h-14 rounded-xl gradient-gold text-primary-foreground font-semibold text-lg transition-transform"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send OTP
                <ArrowRight className="w-5 h-5" />
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
                className="w-full h-14 rounded-xl gradient-gold text-primary-foreground font-semibold text-lg transition-transform"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Verify & Sign In
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
