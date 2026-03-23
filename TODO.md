# Vercel Deployment Fix - Restructure Supabase Integration
Status: In Progress

## Steps:
- [x] Step 1: Update tailwind.config.ts - Simplify content paths to ['./src/**/*.{ts,tsx}']
- [x] Step 2: Move Supabase to src/lib/supabase & update imports
- [x] Step 3: Update src/lib/supabase.ts if needed
- [x] Step 4: Add Vercel env var instructions to README.md
- [x] Step 5: Test `npm run build`
- [ ] Step 6: User adds VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY to Vercel dashboard
- [ ] Step 7: `vercel --prod`

