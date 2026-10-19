CREATE OR REPLACE FUNCTION public.pet_action(p_action text, p_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE u uuid := auth.uid(); cost int; bal int; row_ user_pets%ROWTYPE; eq text;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO user_pets(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u FOR UPDATE;
  IF p_action = 'unequip' THEN
    UPDATE profiles SET equipped_pet_id = NULL WHERE user_id = u;
  ELSE
    cost := CASE p_id WHEN 'puppy' THEN 300 WHEN 'kitten' THEN 300 WHEN 'goldfish' THEN 300 WHEN 'bunny' THEN 800 WHEN 'parrot' THEN 800 WHEN 'baby-dragon' THEN 2000 ELSE NULL END;
    IF cost IS NULL THEN RAISE EXCEPTION 'Unknown pet'; END IF;
    IF p_action = 'buy' THEN
      IF NOT (p_id = ANY(row_.owned_pets)) THEN
        SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
        IF coalesce(bal, 0) < cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
        UPDATE profiles SET monere_points = monere_points - cost WHERE user_id = u;
        UPDATE user_pets SET owned_pets = array_append(owned_pets, p_id), updated_at = now() WHERE user_id = u;
      END IF;
    ELSIF p_action = 'equip' THEN
      IF NOT (p_id = ANY(row_.owned_pets)) THEN RAISE EXCEPTION 'Pet not owned'; END IF;
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
    UPDATE profiles SET equipped_pet_id = p_id WHERE user_id = u;
  END IF;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u;
  SELECT equipped_pet_id INTO eq FROM profiles WHERE user_id = u;
  RETURN jsonb_build_object('owned', row_.owned_pets, 'active', eq);
END; $function$;

ALTER TABLE public.point_credits DROP CONSTRAINT point_credits_source_check;
ALTER TABLE public.point_credits ADD CONSTRAINT point_credits_source_check CHECK (source = ANY (ARRAY['pack','subscription','daily_care','game_round','energy_full','daily_login']));

CREATE OR REPLACE FUNCTION public.claim_daily_login()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE u uuid := auth.uid(); today text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD');
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF EXISTS (SELECT 1 FROM point_credits WHERE user_id = u AND source = 'daily_login' AND reference = today) THEN
    RETURN jsonb_build_object('claimed', false, 'points', 0);
  END IF;
  INSERT INTO point_credits(user_id, source, reference, points) VALUES (u, 'daily_login', today, 25) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('claimed', true, 'points', 25);
END; $function$;

GRANT EXECUTE ON FUNCTION public.claim_daily_login() TO authenticated;