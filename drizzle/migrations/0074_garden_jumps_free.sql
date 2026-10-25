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
 -- Duplicate or out-of-order jump commits are already recorded; acknowledge without counting again.
 IF NOT p_finish AND p_jumps<=r.jumps THEN RETURN jsonb_build_object('energy',e,'gained',0,'points',0,'state',s); END IF;
 IF p_ticks>24000 OR now()>r.started_at+interval '25 minutes' OR clock_timestamp()<r.started_at+p_ticks*interval '0.05 seconds'-interval '1 second' THEN RAISE EXCEPTION 'Invalid garden timing'; END IF;
 -- Jumps are free: they are recorded for replay checks but never charge Energy.
 IF NOT p_finish THEN
  UPDATE public.garden_barrel_rounds SET jumps=p_jumps,ticks=GREATEST(ticks,p_ticks) WHERE id=r.id;
 ELSE
  INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(p_user,'game_round','vernon-garden:'||p_user,20) ON CONFLICT(reference) DO NOTHING;
  IF FOUND THEN pts:=20; g:=greatest(0,least(50,100-e)); e:=e+g; UPDATE public.profiles SET monere_energy=e WHERE user_id=p_user; END IF;
  IF NOT(s->'quests' ? 'vernon-garden') THEN s:=jsonb_set(s,'{quests}',s->'quests'||'"vernon-garden"'::jsonb); END IF;
  s:=s||'{"zone":"meadow","x":12,"y":27,"pet":null}'::jsonb;
  UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user;
  UPDATE public.garden_barrel_rounds SET settled_at=now(),jumps=p_jumps,ticks=p_ticks,gained=g,points=pts WHERE id=r.id;
 END IF;
 RETURN jsonb_build_object('energy',e,'gained',g,'points',pts,'state',s);
END $$;
REVOKE ALL ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.garden_barrel_commit(uuid,uuid,integer,integer,boolean) TO service_role;
NOTIFY pgrst,'reload schema';