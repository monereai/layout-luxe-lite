ALTER TABLE public.orchard_maze_rounds ADD COLUMN practice boolean NOT NULL DEFAULT false;

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
 IF NOT practice_round AND NOT public.is_premium('live') AND (SELECT count(*) FROM public.orchard_maze_rounds WHERE user_id=u AND NOT practice AND (started_at AT TIME ZONE 'UTC')::date=(now() AT TIME ZONE 'UTC')::date)>=2 THEN RAISE EXCEPTION 'Free players can enter the Energy maze twice a day. Monere Plus members harvest without limits!'; END IF;
 INSERT INTO public.orchard_maze_rounds(user_id,tree,world_zone,practice) VALUES(u,p_tree,s->>'zone',practice_round) RETURNING id INTO r;
 RETURN jsonb_build_object('id',r,'practice',practice_round);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_start(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.orchard_maze_start(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.orchard_maze_settle_scroll(p_user uuid,p_round uuid,p_energy integer,p_ticks integer,p_expelled boolean,p_scroll_reached boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.orchard_maze_rounds%ROWTYPE; cur integer; g integer:=0; s jsonb; at jsonb; scroll_awarded boolean:=false;
 entrances jsonb:='{"meadow":{"x":10,"y":12},"wood":{"x":3,"y":10},"ravine":{"x":3,"y":6},"lair":{"x":12,"y":19}}';
BEGIN
 SELECT * INTO r FROM public.orchard_maze_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Harvest not found'; END IF;
 IF p_energy<0 OR p_energy>300 OR p_ticks<0 OR p_ticks>3000 THEN RAISE EXCEPTION 'Invalid harvest'; END IF;
 IF r.settled_at IS NULL AND (now()<r.started_at+p_ticks*interval '0.2 seconds'-interval '1 second' OR now()>r.started_at+interval '20 minutes') THEN RAISE EXCEPTION 'Harvest timing is invalid'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO cur FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF cur IS NULL OR s IS NULL THEN RAISE EXCEPTION 'Profile or adventure missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',cur,'gained',0,'state',s,'scrollAwarded',false); END IF;
 IF s->>'zone'<>r.world_zone THEN RAISE EXCEPTION 'The land changed during this harvest'; END IF;
 IF NOT r.practice THEN
  g:=greatest(0,least(p_energy,100-cur));
  INSERT INTO public.orchard_harvests(user_id,tree,day,energy) VALUES(p_user,r.tree,(now() AT TIME ZONE 'UTC')::date,g) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN g:=0; END IF;
  UPDATE public.profiles SET monere_energy=cur+g WHERE user_id=p_user;
 END IF;
 IF p_scroll_reached AND r.tree='caverns-1' AND r.world_zone='ravine' AND NOT coalesce(s->'scrolls','[]'::jsonb) ? 'ravine' THEN
  s:=jsonb_set(s,'{scrolls}',coalesce(s->'scrolls','[]'::jsonb)||'["ravine"]'::jsonb); scroll_awarded:=true;
 END IF;
 IF p_expelled THEN at:=entrances->r.world_zone; s:=public.treasure_v4_reveal(s||at||'{"pet":null}'::jsonb); END IF;
 IF scroll_awarded OR p_expelled THEN UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user; END IF;
 UPDATE public.orchard_maze_rounds SET settled_at=now(),collected_energy=p_energy,gained=g,expelled=p_expelled WHERE id=r.id;
 RETURN jsonb_build_object('energy',cur+g,'gained',g,'state',s,'scrollAwarded',scroll_awarded);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_settle_scroll(uuid,uuid,integer,integer,boolean,boolean) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.orchard_maze_settle_scroll(uuid,uuid,integer,integer,boolean,boolean) TO service_role;