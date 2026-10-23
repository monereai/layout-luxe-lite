CREATE OR REPLACE FUNCTION public.orchard_maze_start(p_tree text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; t jsonb; r uuid; e integer;
 trees jsonb:='{"meadow-1":["meadow",6,12],"wood-1":["wood",11,6],"ravine-1":["ravine",9,16],"lair-1":["lair",18,8],"grove-1":["meadow",8,12],"grove-2":["meadow",8,12],"grove-3":["meadow",8,12],"caverns-1":["ravine",4,6]}';
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to harvest'; END IF;
 t:=trees->p_tree; IF t IS NULL THEN RAISE EXCEPTION 'Unknown tree'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s IS NULL OR coalesce((s->>'rescued')::boolean,false) OR s->>'zone'<>t->>0 OR abs((s->>'x')::int-(t->>1)::int)+abs((s->>'y')::int-(t->>2)::int)>1 THEN RAISE EXCEPTION 'Reach the Energy Tree first'; END IF;
 PERFORM public.care_apply('sync');
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=u FOR UPDATE;
 IF p_tree IN ('grove-1','grove-2','grove-3') AND e<50 THEN RAISE EXCEPTION 'The elemental gate needs 50 Energy'; END IF;
 IF EXISTS(SELECT 1 FROM public.orchard_harvests WHERE user_id=u AND tree=p_tree AND day=(now() AT TIME ZONE 'UTC')::date) THEN RAISE EXCEPTION 'This tree has been harvested today. Come back tomorrow!'; END IF;
 INSERT INTO public.orchard_maze_rounds(user_id,tree,world_zone) VALUES(u,p_tree,s->>'zone') RETURNING id INTO r;
 RETURN jsonb_build_object('id',r);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_start(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.orchard_maze_start(text) TO authenticated;