CREATE TABLE public.profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 monere_energy integer NOT NULL DEFAULT 50 CHECK (monere_energy BETWEEN 0 AND 100),
 last_energy_drain timestamptz NOT NULL DEFAULT now(),
 daily_care_claimed boolean NOT NULL DEFAULT false,
 last_care_claim_date date,
 tokens integer NOT NULL DEFAULT 0 CHECK (tokens >= 0)
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own care profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.care_game_rounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 kind text NOT NULL CHECK (kind IN ('find','jigsaw')),
 size integer NOT NULL DEFAULT 3 CHECK (size IN (3,4,5,6)),
 initial_order integer[] NOT NULL DEFAULT '{}',
 completed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.care_game_rounds TO authenticated;
GRANT ALL ON public.care_game_rounds TO service_role;
ALTER TABLE public.care_game_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own game rounds" ON public.care_game_rounds FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE INDEX care_game_rounds_user_idx ON public.care_game_rounds(user_id,created_at);
CREATE FUNCTION public.care_apply(p_action text DEFAULT 'sync') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.profiles; hours integer; today date := (now() AT TIME ZONE 'UTC')::date; allowance integer; payout integer := 0; added integer := 0;
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
 UPDATE public.profiles SET monere_energy=p.monere_energy,last_energy_drain=p.last_energy_drain,daily_care_claimed=p.daily_care_claimed,last_care_claim_date=p.last_care_claim_date,tokens=p.tokens WHERE user_id=auth.uid();
 RETURN jsonb_build_object('energy',p.monere_energy,'lastDrain',p.last_energy_drain,'claimed',p.daily_care_claimed,'claimDate',p.last_care_claim_date,'tokens',p.tokens,'allowance',allowance,'pointsAwarded',payout,'energyAwarded',added,'today',today);
END; $$;
REVOKE ALL ON FUNCTION public.care_apply(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_apply(text) TO authenticated;
CREATE FUNCTION public.care_start_round(p_kind text,p_size integer DEFAULT 3) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.care_game_rounds; a integer[];
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 IF p_kind NOT IN ('find','jigsaw') OR p_size NOT IN (3,4,5,6) THEN RAISE EXCEPTION 'Invalid game'; END IF;
 IF p_kind='jigsaw' THEN
  SELECT array_agg(i ORDER BY random()) INTO a FROM generate_series(0,p_size*p_size-1) i;
  IF a=ARRAY(SELECT generate_series(0,p_size*p_size-1)) THEN a[1]:=1; a[2]:=0; END IF;
 ELSE a:='{}'; END IF;
 INSERT INTO public.care_game_rounds(user_id,kind,size,initial_order) VALUES(auth.uid(),p_kind,p_size,a) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'order',r.initial_order);
END; $$;
REVOKE ALL ON FUNCTION public.care_start_round(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_start_round(text,integer) TO authenticated;
CREATE FUNCTION public.care_finish_round(p_round uuid,p_proof jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; move jsonb; x integer; y integer; temp integer; gained integer;
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
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'game_round','round:'||r.id,5);
 UPDATE public.care_game_rounds SET completed=true WHERE id=r.id;
 RETURN state || jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',5);
END; $$;
REVOKE ALL ON FUNCTION public.care_finish_round(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_finish_round(uuid,jsonb) TO authenticated;