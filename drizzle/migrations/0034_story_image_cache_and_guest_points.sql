CREATE TABLE public.story_images (
  scene_hash text PRIMARY KEY,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.story_images TO service_role;
ALTER TABLE public.story_images ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.point_credits DROP CONSTRAINT point_credits_source_check;
ALTER TABLE public.point_credits ADD CONSTRAINT point_credits_source_check CHECK (source = ANY (ARRAY['pack','subscription','daily_care','game_round','energy_full','daily_login','daily_dilemma','biblical_snap','guest_preview']));

-- One-time, capped welcome credit for points shown during the guest preview.
CREATE OR REPLACE FUNCTION public.claim_guest_points(p_points integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid := auth.uid(); amt integer := LEAST(GREATEST(COALESCE(p_points,0),0),60);
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF amt = 0 THEN RETURN 0; END IF;
  INSERT INTO point_credits(user_id, source, reference, points) VALUES (u, 'guest_preview', 'guest:' || u::text, amt) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 0; END IF;
  RETURN amt;
END $$;
REVOKE ALL ON FUNCTION public.claim_guest_points(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_guest_points(integer) TO authenticated;