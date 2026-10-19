CREATE OR REPLACE FUNCTION public.is_sandbox_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND lower(email) = 'carlhillyard@icloud.com' AND email_confirmed_at IS NOT NULL)
$$;
REVOKE ALL ON FUNCTION public.is_sandbox_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_sandbox_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.qa_action(p_action text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); current_tier text; next_tier text;
BEGIN
 IF u IS NULL OR NOT (public.has_role(u,'admin') OR public.has_role(u,'tester') OR public.is_sandbox_admin()) THEN RAISE EXCEPTION 'Admin or tester access required'; END IF;
 INSERT INTO profiles(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT public.account_tier(u) INTO current_tier FROM profiles WHERE user_id=u FOR UPDATE;
 IF p_action='fill' THEN UPDATE profiles SET monere_energy=100,last_energy_drain=now() WHERE user_id=u;
 ELSIF p_action='reset_claim' THEN UPDATE profiles SET last_energy_claim_date=NULL,last_care_claim_date=NULL,daily_care_claimed=false WHERE user_id=u;
 ELSIF p_action='topup' THEN UPDATE profiles SET monere_points=monere_points+99999, monere_tokens=monere_tokens+99999 WHERE user_id=u;
 ELSIF p_action='add_points' THEN UPDATE profiles SET monere_points=monere_points+1000 WHERE user_id=u;
 ELSIF p_action='reset_inventory' THEN
   INSERT INTO user_pets(user_id) VALUES(u) ON CONFLICT DO NOTHING;
   UPDATE user_pets SET owned_pets='{}', active_pet=NULL, updated_at=now() WHERE user_id=u;
   UPDATE profiles SET equipped_pet_id=NULL WHERE user_id=u;
   INSERT INTO user_properties(user_id) VALUES(u) ON CONFLICT DO NOTHING;
   UPDATE user_properties SET unlocked_properties=ARRAY['treehouse'], active_property='treehouse', updated_at=now() WHERE user_id=u;
 ELSIF p_action IN ('club','toggle_tier') THEN
 next_tier:=CASE WHEN p_action='club' THEN 'monere_club' WHEN current_tier='free' THEN 'monere_plus' WHEN current_tier='monere_plus' THEN 'monere_club' ELSE 'free' END;
 UPDATE profiles SET qa_subscription_tier=next_tier,subscription_tier=next_tier WHERE user_id=u;
 ELSE RAISE EXCEPTION 'Unknown action'; END IF;
 RETURN jsonb_build_object('ok',true,'tier',public.account_tier(u));
END; $$;
REVOKE ALL ON FUNCTION public.qa_action(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.qa_action(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.pet_action(p_action text, p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE u uuid := auth.uid(); cost int; bal int; row_ user_pets%ROWTYPE; eq text; free_ boolean := public.is_sandbox_admin();
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

CREATE OR REPLACE FUNCTION public.property_action(p_action text,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); cost int; bal int; club boolean; row_ user_properties%ROWTYPE;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 cost:=CASE p_id WHEN 'treehouse' THEN 0 WHEN 'beach-bungalow' THEN 540 WHEN 'cozy-bedroom' THEN 720 WHEN 'space-station' THEN 0 ELSE NULL END;
 IF cost IS NULL THEN RAISE EXCEPTION 'Unknown habitat'; END IF;
 IF public.is_sandbox_admin() THEN cost:=0; END IF;
 club:=public.account_tier(u)='monere_club';
 IF p_id='space-station' AND NOT club THEN RAISE EXCEPTION 'Monere Club required for Space Station'; END IF;
 INSERT INTO user_properties(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT * INTO row_ FROM user_properties WHERE user_id=u FOR UPDATE;
 IF p_action='buy' THEN
 IF NOT(p_id=ANY(row_.unlocked_properties)) THEN
 IF cost>0 THEN
 SELECT monere_points INTO bal FROM profiles WHERE user_id=u FOR UPDATE;
 IF coalesce(bal,0)<cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
 INSERT INTO point_credits(user_id,source,reference,points) VALUES(u,'habitat','habitat:'||u||':'||p_id,-cost);
 END IF;
 UPDATE user_properties SET unlocked_properties=array_append(unlocked_properties,p_id) WHERE user_id=u;
 END IF;
 UPDATE user_properties SET active_property=p_id,updated_at=now() WHERE user_id=u;
 ELSIF p_action='equip' THEN
 IF NOT(p_id=ANY(row_.unlocked_properties)) AND NOT(club AND p_id='space-station') THEN RAISE EXCEPTION 'Habitat locked'; END IF;
 UPDATE user_properties SET active_property=p_id,updated_at=now() WHERE user_id=u;
 ELSE RAISE EXCEPTION 'Unknown action'; END IF;
 SELECT * INTO row_ FROM user_properties WHERE user_id=u;
 RETURN jsonb_build_object('unlocked',row_.unlocked_properties,'active',row_.active_property);
END; $$;