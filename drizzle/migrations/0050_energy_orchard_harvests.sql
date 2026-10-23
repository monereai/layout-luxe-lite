CREATE TABLE public.orchard_harvests (
  user_id uuid NOT NULL,
  tree text NOT NULL,
  day date NOT NULL,
  energy integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tree, day)
);
GRANT SELECT ON public.orchard_harvests TO authenticated;
GRANT ALL ON public.orchard_harvests TO service_role;
ALTER TABLE public.orchard_harvests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orchard harvests" ON public.orchard_harvests FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.orchard_harvest(p_tree text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); today date := (now() AT TIME ZONE 'UTC')::date; cur integer; gained integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in to harvest'; END IF;
  IF p_tree NOT IN ('meadow-1','grove-1','grove-2','grove-3','caverns-1') THEN RAISE EXCEPTION 'Unknown tree'; END IF;
  SELECT monere_energy INTO cur FROM public.profiles WHERE user_id = uid FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF EXISTS (SELECT 1 FROM public.orchard_harvests WHERE user_id = uid AND tree = p_tree AND day = today) THEN
    RETURN jsonb_build_object('energy', cur, 'gained', 0, 'harvested', false);
  END IF;
  gained := least(25, 100 - cur);
  INSERT INTO public.orchard_harvests(user_id, tree, day, energy) VALUES (uid, p_tree, today, gained);
  UPDATE public.profiles SET monere_energy = cur + gained WHERE user_id = uid;
  RETURN jsonb_build_object('energy', cur + gained, 'gained', gained, 'harvested', true);
END $$;
REVOKE ALL ON FUNCTION public.orchard_harvest(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.orchard_harvest(text) TO authenticated;