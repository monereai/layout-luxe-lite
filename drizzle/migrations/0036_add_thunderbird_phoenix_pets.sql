CREATE OR REPLACE FUNCTION public.pet_action(p_action text, p_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE u uuid := auth.uid(); cost int; bal int; row_ user_pets%ROWTYPE; eq text; free_ boolean := public.is_sandbox_admin();
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO user_pets(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u FOR UPDATE;
  IF p_action = 'unequip' THEN
    UPDATE profiles SET equipped_pet_id = NULL WHERE user_id = u;
  ELSE
    cost := CASE p_id WHEN 'puppy' THEN 300 WHEN 'kitten' THEN 300 WHEN 'goldfish' THEN 300 WHEN 'hedgehog' THEN 300 WHEN 'turtle' THEN 300 WHEN 'bunny' THEN 800 WHEN 'parrot' THEN 800 WHEN 'fox' THEN 800 WHEN 'owl' THEN 800 WHEN 'baby-dragon' THEN 2000 WHEN 'unicorn' THEN 2000 WHEN 'thunderbird' THEN 2000 WHEN 'phoenix' THEN 2000 ELSE NULL END;
    IF cost IS NULL THEN RAISE EXCEPTION 'Unknown pet'; END IF;
    IF p_action = 'buy' THEN
      IF NOT (p_id = ANY(row_.owned_pets)) THEN
        IF NOT free_ THEN
          SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
          IF coalesce(bal, 0) < cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
          UPDATE profiles SET monere_points = monere_points - cost WHERE user_id = u;
        END IF;
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