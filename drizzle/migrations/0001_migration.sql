ALTER TABLE public.organization_codes ADD COLUMN IF NOT EXISTS owner_user_id uuid, ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
CREATE POLICY "Leaders view own group code" ON public.organization_codes FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
GRANT SELECT ON public.organization_codes TO authenticated;