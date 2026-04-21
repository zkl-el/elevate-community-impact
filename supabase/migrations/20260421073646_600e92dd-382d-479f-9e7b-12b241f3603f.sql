DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Roles publicly viewable"
  ON public.user_roles FOR SELECT
  USING (true);