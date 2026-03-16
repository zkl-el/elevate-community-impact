# Phone Auth Flow Improvements (Keep Current SMS Provider)

## Approved Plan Summary (Updated)
Keep current SMS provider. Add DB trigger for auto profile creation on auth.users insert. Ensure profiles.role default 'member'. Add OTP attempt limits (5 tries). Other flow already matches task (OTP table, gen/verification, user create, dashboard redirect).

Current progress: 0/8 steps

### 1. ✅ Create TODO.md [COMPLETED]

### 2. ✅ Create new migration for profiles trigger + role column [COMPLETED]
Migration: supabase/migrations/20260313120000_add_profiles_trigger_and_role.sql created.
- File: supabase/migrations/20260313XXXXXX_add_profiles_trigger_and_role.sql
- Content: Task's create table profiles (if needed), create function create_profile(), create trigger on_user_created.

### 3. Add NEXTSMS_API_KEY documentation
- Update README.md or .env.example

### 4. ✅ Update Edge Functions Security (3 req/min, 5 attempts/5min) [COMPLETED]
- send-sms-otp: Rate limit now 3/min (was 15/hr).
- verify-sms-otp: Max 5 unverified attempts/5min + profile role='member'.

### 6. User sets NEXTSMS_API_KEY in Supabase Dashboard → Settings → Functions → Environment Variables

### 7. Deploy changes
- supabase db push (migration)
- supabase functions deploy send-sms-otp verify-sms-otp

### 8. Test complete flow + attempt_completion

**Notes:**
- User confirmed plan but did NOT provide API key yet → will ask in step 6.
- profiles.role: Will check schema in migration if needed.
- No frontend changes needed (flow already perfect).

