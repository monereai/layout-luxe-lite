CREATE TABLE public.user_wardrobes (
 user_id uuid PRIMARY KEY,
 shop_state jsonb NOT NULL DEFAULT '{"spent":0,"owned":[],"equipped":{}}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT wardrobe_shape CHECK (jsonb_typeof(shop_state) = 'object' AND jsonb_typeof(shop_state->'owned') = 'array' AND jsonb_typeof(shop_state->'equipped') = 'object')
);
GRANT SELECT, INSERT, UPDATE ON public.user_wardrobes TO authenticated;
GRANT ALL ON public.user_wardrobes TO service_role;
ALTER TABLE public.user_wardrobes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own wardrobe" ON public.user_wardrobes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Create own wardrobe" ON public.user_wardrobes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Save own wardrobe" ON public.user_wardrobes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
COMMENT ON TABLE public.user_wardrobes IS 'Account-scoped mirror of existing legacy clothing inventory and local spending; does not grant points, pets or membership entitlements.';