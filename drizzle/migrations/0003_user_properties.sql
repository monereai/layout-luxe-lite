CREATE TABLE public.user_properties (
  user_id uuid PRIMARY KEY,
  unlocked_properties text[] NOT NULL DEFAULT ARRAY['treehouse'],
  active_property text NOT NULL DEFAULT 'treehouse',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_properties TO authenticated;
GRANT ALL ON public.user_properties TO service_role;
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own properties select" ON public.user_properties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own properties insert" ON public.user_properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own properties update" ON public.user_properties FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);