CREATE OR REPLACE FUNCTION public.pet_action(p_action text, p_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE u uuid := auth.uid(); cost int; bal int; row_ user_pets%ROWTYPE;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  cost := CASE p_id WHEN 'puppy' THEN 150 WHEN 'kitten' THEN 150 WHEN 'goldfish' THEN 100 WHEN 'bunny' THEN 200 WHEN 'parrot' THEN 250 WHEN 'baby-dragon' THEN 500 ELSE NULL END;
  IF cost IS NULL THEN RAISE EXCEPTION 'Unknown pet'; END IF;
  INSERT INTO user_pets(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u FOR UPDATE;
  IF p_action = 'buy' THEN
    IF NOT (p_id = ANY(row_.owned_pets)) THEN
      SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
      IF coalesce(bal, 0) < cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
      UPDATE profiles SET monere_points = monere_points - cost WHERE user_id = u;
      UPDATE user_pets SET owned_pets = array_append(owned_pets, p_id) WHERE user_id = u;
    END IF;
    UPDATE user_pets SET active_pet = p_id, updated_at = now() WHERE user_id = u;
  ELSIF p_action = 'equip' THEN
    IF NOT (p_id = ANY(row_.owned_pets)) THEN RAISE EXCEPTION 'Pet not owned'; END IF;
    UPDATE user_pets SET active_pet = p_id, updated_at = now() WHERE user_id = u;
  ELSE RAISE EXCEPTION 'Unknown action'; END IF;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u;
  RETURN jsonb_build_object('owned', row_.owned_pets, 'active', row_.active_pet);
END; $$;