
-- Fix permissive audit_log INSERT policy
DROP POLICY "System can insert audit entries" ON public.audit_log;
CREATE POLICY "Authenticated users can insert own audit entries" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
