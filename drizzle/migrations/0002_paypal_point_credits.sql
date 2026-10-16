CREATE TABLE public.point_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('pack','subscription')),
  reference text NOT NULL UNIQUE,
  points integer NOT NULL CHECK (points > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.point_credits TO authenticated;
GRANT ALL ON public.point_credits TO service_role;
ALTER TABLE public.point_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own point credits" ON public.point_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX point_credits_user_idx ON public.point_credits(user_id);