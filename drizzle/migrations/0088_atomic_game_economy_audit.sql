CREATE TABLE public.adventure_coin_credits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, reference text NOT NULL UNIQUE, coins integer NOT NULL CHECK(coins>0), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.adventure_coin_credits TO authenticated;
GRANT ALL ON public.adventure_coin_credits TO service_role;
ALTER TABLE public.adventure_coin_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own adventure Coins" ON public.adventure_coin_credits FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.energy_overflow_internal(p_user uuid,p_excess integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE accumulated integer; payout integer;
BEGIN
 IF p_excess IS NULL OR p_excess<0 THEN RAISE EXCEPTION 'Invalid overflow'; END IF;
 SELECT energy_overflow+p_excess INTO accumulated FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF accumulated IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
 payout:=(accumulated/100)*5;
 UPDATE public.profiles SET energy_overflow=accumulated%100 WHERE user_id=p_user;
 IF payout>0 THEN INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(p_user,'energy_overflow','energy-overflow:'||p_user||':'||gen_random_uuid(),payout); END IF;
 RETURN payout;
END $$;
REVOKE ALL ON FUNCTION public.energy_overflow_internal(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.energy_overflow_internal(uuid,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.energy_overflow_credit(p_amount integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RAISE EXCEPTION 'Overflow is credited only with verified rewards'; END $$;
REVOKE ALL ON FUNCTION public.energy_overflow_credit(integer) FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION public.energy_overflow_credit(integer) IS 'DEPRECATED: overflow is settled atomically by verified reward functions';
CREATE OR REPLACE FUNCTION public.garden_barrel_commit(p_user uuid,p_round uuid,p_ticks integer,p_jumps integer,p_finish boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.garden_barrel_rounds; s jsonb; e integer; g integer:=0; c integer:=0; bonus integer:=0; cost integer;
BEGIN
 SELECT * INTO r FROM public.garden_barrel_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Garden round not found'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF e IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Profile or adventure missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',e,'gained',0,'points',0,'coins',0,'overflowPoints',0,'state',s); END IF;
 IF s->>'zone'<>'garden' OR NOT(s->'quests' ? 'vernon') THEN RAISE EXCEPTION 'The garden changed during this round'; END IF;
 IF p_ticks IS NULL OR p_ticks<0 OR p_ticks>24000 OR p_jumps IS NULL OR p_jumps<0 OR p_jumps>p_ticks OR now()>r.started_at+interval '25 minutes' OR clock_timestamp()<r.started_at+p_ticks*interval '0.05 seconds'-interval '1 second' THEN RAISE EXCEPTION 'Invalid garden timing'; END IF;
 cost:=greatest(0,p_jumps-r.jumps)*5;
 IF e<cost THEN RAISE EXCEPTION 'Each jump needs 5 Energy'; END IF;
 e:=e-cost; UPDATE public.profiles SET monere_energy=e WHERE user_id=p_user;
 UPDATE public.garden_barrel_rounds SET jumps=greatest(jumps,p_jumps),ticks=greatest(ticks,p_ticks) WHERE id=r.id;
 IF p_finish THEN
  INSERT INTO public.adventure_coin_credits(user_id,reference,coins) VALUES(p_user,'vernon-garden:'||p_user,20) ON CONFLICT(reference) DO NOTHING;
  IF FOUND THEN
   c:=20;
   IF NOT EXISTS(SELECT 1 FROM public.point_credits WHERE reference='vernon-garden:'||p_user) THEN
    g:=greatest(0,least(50,100-e)); bonus:=public.energy_overflow_internal(p_user,50-g); e:=e+g;
    UPDATE public.profiles SET monere_energy=e WHERE user_id=p_user;
   END IF;
  END IF;
  IF NOT(s->'quests' ? 'vernon-garden') THEN s:=jsonb_set(s,'{quests}',s->'quests'||'"vernon-garden"'::jsonb); END IF;
  IF NOT(coalesce(s->'scrolls','[]'::jsonb) ? 'meadow') THEN s:=jsonb_set(s,'{scrolls}',coalesce(s->'scrolls','[]'::jsonb)||'["meadow"]'::jsonb); END IF;
  s:=s||jsonb_build_object('coins',(SELECT coalesce(sum(coins),0) FROM public.adventure_coin_credits WHERE user_id=p_user),'hasScroll',true,'zone','meadow','x',12,'y',27,'pet',null);
  UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user;
  UPDATE public.garden_barrel_rounds SET settled_at=now(),gained=g,points=0 WHERE id=r.id;
 END IF;
 RETURN jsonb_build_object('energy',e,'gained',g,'points',0,'coins',c,'overflowPoints',bonus,'state',s);
END $$;
REVOKE ALL ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) TO service_role;
DO $audit$
DECLARE name text; definition text; before text; after text;
BEGIN
 FOR name,before,after IN SELECT * FROM (VALUES
 ('connie_arcade_commit','s:=jsonb_set(s,''{connieMiniGameWon}'',''true''::jsonb);','INSERT INTO public.adventure_coin_credits(user_id,reference,coins) VALUES(p_user,''connie-arcade:''||p_user,20) ON CONFLICT(reference) DO NOTHING; s:=s||jsonb_build_object(''coins'',(SELECT coalesce(sum(coins),0) FROM public.adventure_coin_credits WHERE user_id=p_user)); s:=jsonb_set(s,''{connieMiniGameWon}'',''true''::jsonb);'),
 ('treasure_v6_action','UPDATE public.profiles SET monere_energy=LEAST(monere_energy+10,100) WHERE user_id=u RETURNING monere_energy INTO e;','SELECT monere_energy INTO e FROM public.profiles WHERE user_id=u FOR UPDATE; PERFORM public.energy_overflow_internal(u,greatest(0,e+10-100)); UPDATE public.profiles SET monere_energy=LEAST(monere_energy+10,100) WHERE user_id=u RETURNING monere_energy INTO e;'),
 ('treasure_v5_action','UPDATE public.profiles SET monere_energy=LEAST(monere_energy+10,100) WHERE user_id=u RETURNING monere_energy INTO e;','SELECT monere_energy INTO e FROM public.profiles WHERE user_id=u FOR UPDATE; PERFORM public.energy_overflow_internal(u,greatest(0,e+10-100)); UPDATE public.profiles SET monere_energy=LEAST(monere_energy+10,100) WHERE user_id=u RETURNING monere_energy INTO e;'),
 ('orchard_maze_settle_scroll','IF NOT FOUND THEN g:=0; END IF;','IF NOT FOUND THEN g:=0; ELSE PERFORM public.energy_overflow_internal(p_user,p_energy-g); END IF;'),
 ('orchard_maze_settle','IF NOT FOUND THEN g:=0; END IF;','IF NOT FOUND THEN g:=0; ELSE PERFORM public.energy_overflow_internal(p_user,p_energy-g); END IF;'),
 ('orchard_harvest','UPDATE public.profiles SET monere_energy = cur + gained WHERE user_id = uid;','PERFORM public.energy_overflow_internal(uid,25-gained); UPDATE public.profiles SET monere_energy = cur + gained WHERE user_id = uid;'),
 ('care_finish_round','UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();','state:=state||jsonb_build_object(''overflowPoints'',public.energy_overflow_internal(auth.uid(),5-gained)); UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();'),
 ('care_reward_piece','UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();','state:=state||jsonb_build_object(''overflowPoints'',public.energy_overflow_internal(auth.uid(),5-gained)); UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();'),
 ('daily_dilemma_action','UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=u;','state:=state||jsonb_build_object(''overflowPoints'',public.energy_overflow_internal(u,25-gained)); UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=u;'),
 ('biblical_snap_action','UPDATE public.profiles SET monere_energy=monere_energy+gained,last_biblical_snap=today WHERE user_id=u;','state:=state||jsonb_build_object(''overflowPoints'',public.energy_overflow_internal(u,25-gained)); UPDATE public.profiles SET monere_energy=monere_energy+gained,last_biblical_snap=today WHERE user_id=u;'),
 ('care_apply','p.monere_tokens:=p.monere_tokens-10; added:=least(50,100-p.monere_energy);','p.monere_tokens:=p.monere_tokens-10; added:=least(50,100-p.monere_energy); PERFORM public.energy_overflow_internal(auth.uid(),50-added);')
 ) AS changes(n,b,a) LOOP
  SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=name;
  IF position(before IN definition)=0 THEN RAISE EXCEPTION 'Economy patch missing in %',name; END IF;
  EXECUTE replace(definition,before,after);
 END LOOP;
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='treasure_v6_action';
 before:='s:=public.treasure_v4_reveal(s);';
 IF position(before IN definition)=0 THEN RAISE EXCEPTION 'Missing state return'; END IF;
 EXECUTE replace(definition,before,'s:=s||jsonb_build_object(''coins'',(SELECT coalesce(sum(coins),0) FROM public.adventure_coin_credits WHERE user_id=u),''hasScroll'',coalesce(s->''scrolls'',''[]''::jsonb) ? ''meadow''); '||before);
END $audit$;