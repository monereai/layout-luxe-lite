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
 allowance := CASE WHEN public.is_premium('live') THEN 60 ELSE 30 END;
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

CREATE OR REPLACE FUNCTION public.care_full_bonus() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e integer; bonus integer := 0;
BEGIN
 IF auth.uid() IS NULL THEN RETURN 0; END IF;
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RETURN 0; END IF;
 IF e = 100 THEN
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'energy_full','energy_full:'||auth.uid()||':'||floor(extract(epoch FROM clock_timestamp()))::bigint,20);
  bonus := 20;
  UPDATE public.profiles SET monere_energy=0, full_energy_bonus=false WHERE user_id=auth.uid();
 END IF;
 RETURN bonus;
END; $$;
REVOKE ALL ON FUNCTION public.care_full_bonus() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_full_bonus() TO authenticated;

CREATE OR REPLACE FUNCTION public.care_finish_round(p_round uuid,p_proof jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; move jsonb; x integer; y integer; temp integer; gained integer; bonus integer := 0; final_energy integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game round not found'; END IF;
 IF r.completed THEN RETURN public.care_apply('sync'); END IF;
 IF jsonb_typeof(p_proof) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid round result'; END IF;
 IF r.kind='find' THEN
  IF jsonb_array_length(p_proof)<>10 OR (SELECT count(DISTINCT value::integer) FROM jsonb_array_elements_text(p_proof))<>10 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_proof) WHERE value::integer NOT BETWEEN 0 AND 9) THEN RAISE EXCEPTION 'Find all 10 Mini-Moneres first'; END IF;
 ELSE
  a:=r.initial_order;
  IF jsonb_array_length(p_proof)>10000 THEN RAISE EXCEPTION 'Too many moves'; END IF;
  FOR move IN SELECT value FROM jsonb_array_elements(p_proof) LOOP
   IF jsonb_typeof(move) IS DISTINCT FROM 'array' OR jsonb_array_length(move)<>2 THEN RAISE EXCEPTION 'Invalid puzzle move'; END IF;
   x:=(move->>0)::integer+1; y:=(move->>1)::integer+1;
   IF x NOT BETWEEN 1 AND r.size*r.size OR y NOT BETWEEN 1 AND r.size*r.size THEN RAISE EXCEPTION 'Invalid puzzle move'; END IF;
   temp:=a[x]; a[x]:=a[y]; a[y]:=temp;
  END LOOP;
  IF a<>ARRAY(SELECT generate_series(0,r.size*r.size-1)) THEN RAISE EXCEPTION 'Finish the puzzle first'; END IF;
 END IF;
 state:=public.care_apply('sync'); gained:=least(15,100-(state->>'energy')::integer);
 UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
 bonus:=COALESCE((state->>'fullBonus')::integer,0)+public.care_full_bonus();
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'game_round','round:'||r.id,5);
 UPDATE public.care_game_rounds SET completed=true WHERE id=r.id;
 SELECT monere_energy INTO final_energy FROM public.profiles WHERE user_id=auth.uid();
 RETURN state || jsonb_build_object('energy',final_energy,'energyAwarded',gained,'pointsAwarded',5+bonus,'fullBonus',bonus);
END; $$;
REVOKE ALL ON FUNCTION public.care_finish_round(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_finish_round(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.care_reward_find(p_round uuid, p_spot integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.care_game_rounds; state jsonb; gained integer := 0; bonus integer := 0; final_energy integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 IF p_spot IS NULL OR p_spot NOT BETWEEN 0 AND 9 THEN RAISE EXCEPTION 'Invalid Mini-Monere'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR r.kind <> 'find' THEN RAISE EXCEPTION 'Find round not found'; END IF;
 state := public.care_apply('sync');
 IF NOT r.completed AND NOT (p_spot = ANY(r.rewarded_finds)) THEN
  gained := least(1,100-(state->>'energy')::integer);
  UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
  UPDATE public.care_game_rounds SET rewarded_finds=array_append(rewarded_finds,p_spot) WHERE id=r.id;
 END IF;
 bonus := COALESCE((state->>'fullBonus')::integer,0)+public.care_full_bonus();
 SELECT monere_energy INTO final_energy FROM public.profiles WHERE user_id=auth.uid();
 RETURN state || jsonb_build_object('energy',final_energy,'energyAwarded',gained,'pointsAwarded',bonus,'fullBonus',bonus);
END; $$;
REVOKE ALL ON FUNCTION public.care_reward_find(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_reward_find(uuid,integer) TO authenticated;