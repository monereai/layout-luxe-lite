CREATE OR REPLACE FUNCTION public.care_apply(p_action text DEFAULT 'sync'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.profiles; hours integer; today date := (now() AT TIME ZONE 'UTC')::date; allowance integer; payout integer := 0; added integer := 0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to care for Monere'; END IF;
 IF p_action NOT IN ('sync','claim','snack') THEN RAISE EXCEPTION 'Invalid care action'; END IF;
 INSERT INTO public.profiles(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM public.profiles WHERE user_id=auth.uid() FOR UPDATE;
 hours:=greatest(0,floor(extract(epoch FROM(now()-p.last_energy_drain))/3600)::integer);
 p.monere_energy:=greatest(0,p.monere_energy-hours*10); p.last_energy_drain:=p.last_energy_drain+hours*interval '1 hour';
 p.daily_care_claimed:=p.last_energy_claim_date IS NOT DISTINCT FROM today;
 p.subscription_tier:=public.account_tier(auth.uid());
 allowance:=CASE p.subscription_tier WHEN 'monere_club' THEN 300 WHEN 'monere_plus' THEN 200 ELSE 100 END;
 IF p_action='claim' THEN
  IF p.daily_care_claimed THEN RAISE EXCEPTION 'Daily care reward already claimed today'; END IF;
  IF p.monere_energy<100 THEN RAISE EXCEPTION 'Monere needs 100 energy to claim'; END IF;
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'daily_care','care:'||auth.uid()||':'||today,allowance) ON CONFLICT(reference) DO NOTHING;
  IF FOUND THEN payout:=allowance; END IF;
  p.daily_care_claimed:=true; p.last_energy_claim_date:=today;
 ELSIF p_action='snack' THEN
  IF p.monere_tokens<10 THEN RAISE EXCEPTION 'You need 10 Tokens for a Super Snack'; END IF;
  IF p.monere_energy=100 THEN RAISE EXCEPTION 'Monere is already full of energy'; END IF;
  p.monere_tokens:=p.monere_tokens-10; added:=least(50,100-p.monere_energy); p.monere_energy:=p.monere_energy+added;
 END IF;
 UPDATE public.profiles SET monere_energy=p.monere_energy,last_energy_drain=p.last_energy_drain,daily_care_claimed=p.daily_care_claimed,last_energy_claim_date=p.last_energy_claim_date,last_care_claim_date=p.last_energy_claim_date,monere_tokens=p.monere_tokens,tokens=p.monere_tokens,subscription_tier=p.subscription_tier,full_energy_bonus=false WHERE user_id=auth.uid();
 RETURN jsonb_build_object('energy',p.monere_energy,'lastDrain',p.last_energy_drain,'claimed',p.daily_care_claimed,'claimDate',p.last_energy_claim_date,'tokens',p.monere_tokens,'allowance',allowance,'pointsAwarded',payout,'energyAwarded',added,'today',today,'fullBonus',0);
END; $function$;