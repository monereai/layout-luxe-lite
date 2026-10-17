CREATE OR REPLACE FUNCTION public.credit_verified_membership(p_user uuid,p_subscription text,p_paid_at text,p_month integer,p_tier text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.subscriptions; pts integer; tok integer;
BEGIN
 SELECT * INTO s FROM public.subscriptions WHERE stripe_subscription_id=p_subscription AND user_id=p_user AND stripe_customer_id='paypal' FOR UPDATE;
 IF NOT FOUND OR s.status<>'active' OR s.product_id<>p_tier OR p_tier NOT IN ('plus','club') OR p_month NOT BETWEEN 0 AND 11 OR p_paid_at IS NULL THEN RAISE EXCEPTION 'Invalid verified membership grant'; END IF;
 pts:=CASE WHEN p_tier='club' THEN 250 ELSE 100 END; tok:=CASE WHEN p_tier='club' THEN 75 ELSE 25 END;
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(p_user,'subscription','sub:'||p_subscription||':'||p_paid_at||':'||p_month,pts) ON CONFLICT(reference) DO NOTHING;
 INSERT INTO public.token_credits(user_id,source,reference,tokens) VALUES(p_user,'subscription','subtok:'||p_subscription||':'||p_paid_at||':'||p_month,tok) ON CONFLICT(reference) DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION public.credit_verified_membership(uuid,text,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.credit_verified_membership(uuid,text,text,integer,text) TO service_role;