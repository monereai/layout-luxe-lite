CREATE TABLE public.garden_barrel_rounds (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), settled_at timestamptz, jumps integer NOT NULL DEFAULT 0, ticks integer NOT NULL DEFAULT 0, gained integer NOT NULL DEFAULT 0, points integer NOT NULL DEFAULT 0);
GRANT SELECT ON public.garden_barrel_rounds TO authenticated;
GRANT ALL ON public.garden_barrel_rounds TO service_role;
ALTER TABLE public.garden_barrel_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read garden rounds" ON public.garden_barrel_rounds FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE OR REPLACE FUNCTION public.garden_barrel_start() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; r uuid;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s IS NULL OR s->>'zone'<>'garden' OR NOT(s->'quests' ? 'vernon') THEN RAISE EXCEPTION 'Reach Vernon’s garden first'; END IF;
 IF (SELECT count(*) FROM public.garden_barrel_rounds WHERE user_id=u AND started_at>now()-interval '1 minute')>=6 THEN RAISE EXCEPTION 'Please wait before entering again'; END IF;
 PERFORM public.care_apply('sync');
 INSERT INTO public.garden_barrel_rounds(user_id) VALUES(u) RETURNING id INTO r;
 RETURN jsonb_build_object('id',r);
END $$;
REVOKE ALL ON FUNCTION public.garden_barrel_start() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.garden_barrel_start() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.garden_barrel_commit(p_user uuid,p_round uuid,p_ticks integer,p_jumps integer,p_finish boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.garden_barrel_rounds; s jsonb; e integer; g integer:=0; pts integer:=0;
BEGIN
 SELECT * INTO r FROM public.garden_barrel_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Garden round not found'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF e IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',e,'gained',0,'points',0,'state',s); END IF;
 IF s->>'zone'<>'garden' OR NOT(s->'quests' ? 'vernon') THEN RAISE EXCEPTION 'The garden changed during this round'; END IF;
 IF p_ticks<r.ticks OR p_ticks>24000 OR p_jumps<r.jumps OR now()>r.started_at+interval '25 minutes' OR clock_timestamp()<r.started_at+p_ticks*interval '0.05 seconds'-interval '1 second' THEN RAISE EXCEPTION 'Invalid garden timing'; END IF;
 IF NOT p_finish THEN
  IF p_jumps<>r.jumps+1 OR e<5 THEN RAISE EXCEPTION 'Monere needs 5 Energy to jump'; END IF;
  e:=e-5;
  UPDATE public.profiles SET monere_energy=e WHERE user_id=p_user;
  UPDATE public.garden_barrel_rounds SET jumps=p_jumps,ticks=p_ticks WHERE id=r.id;
 ELSE
  IF p_jumps<>r.jumps THEN RAISE EXCEPTION 'Jump payment mismatch'; END IF;
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(p_user,'game_round','vernon-garden:'||p_user,20) ON CONFLICT(reference) DO NOTHING;
  IF FOUND THEN pts:=20; g:=greatest(0,least(50,100-e)); e:=e+g; UPDATE public.profiles SET monere_energy=e WHERE user_id=p_user; END IF;
  IF NOT(s->'quests' ? 'vernon-garden') THEN s:=jsonb_set(s,'{quests}',s->'quests'||'"vernon-garden"'::jsonb); END IF;
  s:=s||'{"zone":"meadow","x":12,"y":27,"pet":null}'::jsonb;
  UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user;
  UPDATE public.garden_barrel_rounds SET settled_at=now(),ticks=p_ticks,gained=g,points=pts WHERE id=r.id;
 END IF;
 RETURN jsonb_build_object('energy',e,'gained',g,'points',pts,'state',s);
END $$;
REVOKE ALL ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) TO service_role;
NOTIFY pgrst,'reload schema';