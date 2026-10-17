CREATE OR REPLACE FUNCTION public.account_tier(p_user uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT CASE WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id=p_user AND environment IN ('live','sandbox') AND product_id='club' AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end>now())) OR (status='canceled' AND current_period_end>now()))) THEN 'monere_club' WHEN EXISTS(SELECT 1 FROM subscriptions WHERE user_id=p_user AND environment IN ('live','sandbox') AND ((status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end>now())) OR (status='canceled' AND current_period_end>now()))) OR EXISTS(SELECT 1 FROM code_redemptions r JOIN organization_codes c ON c.id=r.code_id WHERE r.user_id=p_user AND c.is_active AND c.expiration_date>now()) THEN 'monere_plus' ELSE 'free' END; $$;
REVOKE ALL ON FUNCTION public.account_tier(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.credit_stripe_membership(p_user uuid,p_subscription text,p_period_key text,p_tier text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.subscriptions; pts integer; tok integer;
BEGIN
 SELECT * INTO s FROM public.subscriptions WHERE stripe_subscription_id=p_subscription AND user_id=p_user AND stripe_customer_id<>'paypal' FOR UPDATE;
 IF NOT FOUND OR s.status NOT IN ('active','trialing') OR s.product_id<>p_tier OR p_tier NOT IN ('plus','club') OR coalesce(p_period_key,'')='' THEN RAISE EXCEPTION 'Invalid verified membership grant'; END IF;
 pts:=CASE WHEN p_tier='club' THEN 250 ELSE 100 END; tok:=CASE WHEN p_tier='club' THEN 75 ELSE 25 END;
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(p_user,'subscription','ssub:'||p_subscription||':'||p_period_key,pts) ON CONFLICT(reference) DO NOTHING;
 INSERT INTO public.token_credits(user_id,source,reference,tokens) VALUES(p_user,'subscription','ssubtok:'||p_subscription||':'||p_period_key,tok) ON CONFLICT(reference) DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.credit_stripe_membership(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_stripe_membership(uuid,text,text,text) TO service_role;