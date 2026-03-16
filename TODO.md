# Supabase Native Phone Auth Migration

**Current:** Custom SMS provider + edge functions.

**Goal:** Native Supabase auth.signInWithOtp / verifyOtp.

**Plan:**
1. [ ] otpService: Add nativeSignInWithPhone(phone) → supabase.auth.signInWithOtp({phone})
2. [ ] otpService: Add nativeVerifyOtp(phone, otp) → supabase.auth.verifyOtp({phone, token: otp, type: 'sms'})
3. [ ] Index.tsx: Replace otpService.generateOTP/verifyOTP → native methods.
4. [ ] Dashboard.tsx: Use supabase.auth.getSession() check.
5. [ ] Test redirect.
6. [ ] Keep SMS provider? Check Supabase SMS config.
7. Deploy if needed.

**Info:** Custom SMS used because Supabase default SMS limited. Backend creates auth.user + session.

Proceed with native?

