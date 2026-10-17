ALTER TABLE public.profiles ADD COLUMN qa_subscription_tier text DEFAULT NULL;
COMMENT ON COLUMN public.profiles.qa_subscription_tier IS 'QA-only override honored exclusively for protected admin/tester roles; never a paid subscription.';
CREATE OR REPLACE FUNCTION public.account_tier(p_user uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT CASE WHEN (public.has_role(p_user,'admin') OR public.has_role(p_user,'tester')) AND (SELECT qa_subscription_tier FROM profiles WHERE user_id=p_user) IN ('free','monere_plus','monere_club') THEN (SELECT qa_subscription_tier FROM profiles WHERE user_id=p_user) WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id=p_user AND environment IN ('live','sandbox') AND product_id='club' AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end>now())) OR (status='canceled' AND current_period_end>now()))) THEN 'monere_club' WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id=p_user AND environment IN ('live','sandbox') AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end>now())) OR (status='canceled' AND current_period_end>now()))) OR EXISTS(SELECT 1 FROM code_redemptions r JOIN organization_codes c ON c.id=r.code_id WHERE r.user_id=p_user AND c.is_active AND c.expiration_date>now()) THEN 'monere_plus' ELSE 'free' END; $$;
REVOKE ALL ON FUNCTION public.account_tier(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.is_premium(check_env text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND CASE WHEN (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'tester')) AND (SELECT qa_subscription_tier FROM profiles WHERE user_id=auth.uid()) IS NOT NULL THEN public.account_tier(auth.uid()) <> 'free' ELSE EXISTS(SELECT 1 FROM subscriptions s WHERE s.user_id=auth.uid() AND s.environment=check_env AND ((s.status IN ('active','trialing','past_due') AND (s.current_period_end IS NULL OR s.current_period_end>now())) OR (s.status='canceled' AND s.current_period_end>now()))) OR EXISTS(SELECT 1 FROM code_redemptions r JOIN organization_codes c ON c.id=r.code_id WHERE r.user_id=auth.uid() AND c.is_active AND c.expiration_date>now()) END; $$;
CREATE OR REPLACE FUNCTION public.qa_action(p_action text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); current_tier text; next_tier text;
BEGIN
 IF u IS NULL OR NOT (public.has_role(u,'admin') OR public.has_role(u,'tester')) THEN RAISE EXCEPTION 'Admin or tester access required'; END IF;
 INSERT INTO profiles(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT public.account_tier(u) INTO current_tier FROM profiles WHERE user_id=u FOR UPDATE;
 IF p_action='fill' THEN UPDATE profiles SET monere_energy=100,last_energy_drain=now() WHERE user_id=u;
 ELSIF p_action='reset_claim' THEN UPDATE profiles SET last_energy_claim_date=NULL,last_care_claim_date=NULL,daily_care_claimed=false WHERE user_id=u;
 ELSIF p_action='topup' THEN
 INSERT INTO point_credits(user_id,source,reference,points) VALUES(u,'qa','qa:'||gen_random_uuid(),99999);
 INSERT INTO token_credits(user_id,source,reference,tokens) VALUES(u,'qa','qa:'||gen_random_uuid(),99999);
 ELSIF p_action IN ('club','toggle_tier') THEN
 next_tier:=CASE WHEN p_action='club' THEN 'monere_club' WHEN current_tier='free' THEN 'monere_plus' WHEN current_tier='monere_plus' THEN 'monere_club' ELSE 'free' END;
 UPDATE profiles SET qa_subscription_tier=next_tier,subscription_tier=next_tier WHERE user_id=u;
 ELSE RAISE EXCEPTION 'Unknown action'; END IF;
 RETURN jsonb_build_object('ok',true,'tier',public.account_tier(u));
END; $$;
REVOKE ALL ON FUNCTION public.qa_action(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.qa_action(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.property_action(p_action text,p_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); cost int; bal int; club boolean; row_ user_properties%ROWTYPE;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 cost:=CASE p_id WHEN 'treehouse' THEN 0 WHEN 'beach-bungalow' THEN 450 WHEN 'cozy-bedroom' THEN 600 WHEN 'space-station' THEN 0 ELSE NULL END;
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
END; $$;
REVOKE ALL ON FUNCTION public.property_action(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.property_action(text,text) TO authenticated;