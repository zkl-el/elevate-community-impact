
DROP POLICY IF EXISTS "Admins can insert church settings" ON public.church_settings;
DROP POLICY IF EXISTS "Admins can update church settings" ON public.church_settings;

CREATE POLICY "Public can insert church settings"
  ON public.church_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update church settings"
  ON public.church_settings FOR UPDATE
  USING (true) WITH CHECK (true);
