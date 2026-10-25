DO $$
DECLARE fn text; definition text; marker text := 'p_action=''collect'' THEN';
BEGIN
 FOREACH fn IN ARRAY ARRAY['treasure_v5_action','treasure_v6_action'] LOOP
  SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=fn;
  IF definition IS NULL OR position(marker in definition)=0 THEN RAISE EXCEPTION 'Missing collect branch in %',fn; END IF;
  definition:=replace(definition,marker,marker||' IF z IN (''meadow'',''wood'') THEN RAISE EXCEPTION ''Win Vernon’s Barn Climb or Connie’s Arcade to earn this scroll''; END IF;');
  EXECUTE definition;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.connie_arcade_commit(p_user uuid, p_round uuid, p_ticks integer, p_catches integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.connie_arcade_rounds; s jsonb; e integer;
BEGIN
 SELECT * INTO r FROM public.connie_arcade_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Arcade round not found'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF e IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',e,'state',s); END IF;
 IF NOT(s->'quests' ? 'connie') THEN RAISE EXCEPTION 'The orchard changed during this round'; END IF;
 IF p_ticks<0 OR p_ticks>24000 OR p_catches<10 OR now()>r.started_at+interval '25 minutes' OR clock_timestamp()<r.started_at+p_ticks*interval '0.05 seconds'-interval '1 second' THEN RAISE EXCEPTION 'Invalid arcade timing or result'; END IF;
 IF NOT(COALESCE(s->'scrolls','[]'::jsonb) ? 'wood') THEN s:=jsonb_set(s,'{scrolls}',COALESCE(s->'scrolls','[]'::jsonb)||'"wood"'::jsonb); END IF;
 s:=jsonb_set(s,'{connieMiniGameWon}','true'::jsonb);
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user;
 UPDATE public.connie_arcade_rounds SET settled_at=now(),ticks=p_ticks,catches=p_catches WHERE id=r.id;
 RETURN jsonb_build_object('energy',e,'state',s);
END $function$;
REVOKE ALL ON FUNCTION public.connie_arcade_commit(uuid,uuid,integer,integer) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.connie_arcade_commit(uuid,uuid,integer,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.orchard_maze_start(p_tree text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; t jsonb; r uuid; e integer; practice_round boolean:=false;
 trees jsonb:='{"meadow-1":["meadow",6,12],"wood-1":["wood",11,6],"ravine-1":["ravine",9,16],"lair-1":["lair",18,8],"grove-1":["meadow",8,12],"grove-2":["meadow",8,12],"grove-3":["meadow",8,12],"caverns-1":["ravine",4,6]}';
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to harvest'; END IF;
 t:=trees->p_tree; IF t IS NULL THEN RAISE EXCEPTION 'Unknown tree'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s IS NULL OR coalesce((s->>'rescued')::boolean,false) OR s->>'zone'<>t->>0 OR abs((s->>'x')::int-(t->>1)::int)+abs((s->>'y')::int-(t->>2)::int)>1 THEN RAISE EXCEPTION 'Reach the Energy Tree first'; END IF;
 PERFORM public.care_apply('sync');
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=u FOR UPDATE;
 IF p_tree IN ('grove-1','grove-2','grove-3') AND e<50 THEN RAISE EXCEPTION 'The elemental gate needs 50 Energy'; END IF;
 IF EXISTS(SELECT 1 FROM public.orchard_harvests WHERE user_id=u AND tree=p_tree AND day=(now() AT TIME ZONE 'UTC')::date) THEN
  IF p_tree='caverns-1' THEN practice_round:=true;
  ELSE RAISE EXCEPTION 'This tree has been harvested today. Come back tomorrow!'; END IF;
 END IF;
 IF NOT practice_round AND NOT public.is_premium('live') AND (SELECT count(*) FROM public.orchard_maze_rounds WHERE user_id=u AND NOT practice AND (started_at AT TIME ZONE 'UTC')::date=(now() AT TIME ZONE 'UTC')::date)>=2 THEN
  IF p_tree='caverns-1' THEN practice_round:=true;
  ELSE RAISE EXCEPTION 'Free players can enter the Energy maze twice a day. Monere Plus members harvest without limits!'; END IF;
 END IF;
 INSERT INTO public.orchard_maze_rounds(user_id,tree,world_zone,practice) VALUES(u,p_tree,s->>'zone',practice_round) RETURNING id INTO r;
 RETURN jsonb_build_object('id',r,'practice',practice_round);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_start(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.orchard_maze_start(text) TO authenticated;