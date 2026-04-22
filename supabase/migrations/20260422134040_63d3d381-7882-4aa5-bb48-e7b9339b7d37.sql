
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS clickpesa_order_reference text,
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT 'clickpesa',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TZS';

CREATE INDEX IF NOT EXISTS idx_contributions_order_reference
  ON public.contributions(clickpesa_order_reference);

CREATE INDEX IF NOT EXISTS idx_contributions_status
  ON public.contributions(status);

-- Allow service role / webhook to update status (already public update is restricted; add explicit policy)
DROP POLICY IF EXISTS "Public update contributions status" ON public.contributions;
CREATE POLICY "Public update contributions status"
  ON public.contributions FOR UPDATE
  USING (true)
  WITH CHECK (true);
