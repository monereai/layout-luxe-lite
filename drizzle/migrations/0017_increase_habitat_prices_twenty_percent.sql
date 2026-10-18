CREATE OR REPLACE FUNCTION public.property_action(p_action text, p_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE u uuid:=auth.uid(); cost int; bal int; club boolean; row_ user_properties%ROWTYPE;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 cost:=CASE p_id WHEN 'treehouse' THEN 0 WHEN 'beach-bungalow' THEN 540 WHEN 'cozy-bedroom' THEN 720 WHEN 'space-station' THEN 0 ELSE NULL END;
 IF cost IS NULL THEN RAISE EXCEPTION 'Unknown habitat'; END IF;
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
END; $function$