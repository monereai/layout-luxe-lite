CREATE TABLE public.token_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  reference text NOT NULL UNIQUE,
  tokens integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.token_credits TO authenticated;
GRANT ALL ON public.token_credits TO service_role;
ALTER TABLE public.token_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own token credits" ON public.token_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.apply_token_credit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(user_id, tokens) VALUES (NEW.user_id, NEW.tokens)
  ON CONFLICT (user_id) DO UPDATE SET tokens = public.profiles.tokens + NEW.tokens;
  RETURN NEW;
END; $$;
CREATE TRIGGER token_credit_apply AFTER INSERT ON public.token_credits FOR EACH ROW EXECUTE FUNCTION public.apply_token_credit();

CREATE OR REPLACE FUNCTION public.care_apply(p_action text DEFAULT 'sync') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; hours integer; today date := (now() AT TIME ZONE 'UTC')::date; allowance integer; payout integer := 0; added integer := 0; bonus integer := 0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to care for Monere'; END IF;
 IF p_action NOT IN ('sync','claim','snack') THEN RAISE EXCEPTION 'Invalid care action'; END IF;
 INSERT INTO public.profiles(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
 SELECT * INTO p FROM public.profiles WHERE user_id=auth.uid() FOR UPDATE;
 hours := greatest(0,floor(extract(epoch FROM (now()-p.last_energy_drain))/3600)::integer);
 p.monere_energy := greatest(0,p.monere_energy-hours*10);
 p.last_energy_drain := p.last_energy_drain + hours * interval '1 hour';
 IF p.last_care_claim_date IS DISTINCT FROM today THEN p.daily_care_claimed := false; END IF;
 allowance := 20;
 IF public.is_premium('live') THEN allowance := 40; END IF;
 IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id=auth.uid() AND product_id='club' AND (status='active' OR current_period_end > now())) THEN allowance := 60; END IF;
 IF p_action='claim' THEN
  IF p.daily_care_claimed THEN RAISE EXCEPTION 'Daily care reward already claimed today'; END IF;
  IF p.monere_energy < 100 THEN RAISE EXCEPTION 'Monere needs 100 energy to claim'; END IF;
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'daily_care','care:'||auth.uid()||':'||today,allowance) ON CONFLICT(reference) DO NOTHING;
  IF FOUND THEN payout:=allowance; END IF;
  p.daily_care_claimed:=true; p.last_care_claim_date:=today;
 ELSIF p_action='snack' THEN
  IF p.tokens<10 THEN RAISE EXCEPTION 'You need 10 Tokens for a Super Snack'; END IF;
  IF p.monere_energy=100 THEN RAISE EXCEPTION 'Monere is already full of energy'; END IF;
  p.tokens:=p.tokens-10; added:=least(50,100-p.monere_energy); p.monere_energy:=p.monere_energy+added;
 END IF;
 IF p.monere_energy = 100 THEN
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'energy_full','energy_full:'||auth.uid()||':'||floor(extract(epoch FROM clock_timestamp()))::bigint,20);
  IF FOUND THEN bonus := 20; END IF;
  p.monere_energy := 0;
  p.full_energy_bonus := false;
 END IF;
 UPDATE public.profiles SET monere_energy=p.monere_energy,last_energy_drain=p.last_energy_drain,daily_care_claimed=p.daily_care_claimed,last_care_claim_date=p.last_care_claim_date,tokens=p.tokens,full_energy_bonus=p.full_energy_bonus WHERE user_id=auth.uid();
 RETURN jsonb_build_object('energy',p.monere_energy,'lastDrain',p.last_energy_drain,'claimed',p.daily_care_claimed,'claimDate',p.last_care_claim_date,'tokens',p.tokens,'allowance',allowance,'pointsAwarded',payout,'energyAwarded',added,'today',today,'fullBonus',bonus);
END; $$;
REVOKE ALL ON FUNCTION public.care_apply(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_apply(text) TO authenticated;