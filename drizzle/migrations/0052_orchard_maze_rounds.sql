CREATE TABLE public.orchard_maze_rounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, tree text NOT NULL,
 world_zone text NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), settled_at timestamptz,
 collected_energy integer NOT NULL DEFAULT 0, gained integer NOT NULL DEFAULT 0, expelled boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.orchard_maze_rounds TO authenticated;
GRANT ALL ON public.orchard_maze_rounds TO service_role;
ALTER TABLE public.orchard_maze_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orchard maze rounds" ON public.orchard_maze_rounds FOR SELECT TO authenticated USING (user_id = auth.uid());
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
 IF p_tree IN ('grove-1','grove-2','grove-3','caverns-1') AND e<50 THEN RAISE EXCEPTION 'The elemental gate needs 50 Energy'; END IF;
 IF EXISTS(SELECT 1 FROM public.orchard_harvests WHERE user_id=u AND tree=p_tree AND day=(now() AT TIME ZONE 'UTC')::date) THEN RAISE EXCEPTION 'This tree has been harvested today. Come back tomorrow!'; END IF;
 INSERT INTO public.orchard_maze_rounds(user_id,tree,world_zone) VALUES(u,p_tree,s->>'zone') RETURNING id INTO r;
 RETURN jsonb_build_object('id',r);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_start(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.orchard_maze_start(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.orchard_maze_settle(p_user uuid,p_round uuid,p_energy integer,p_ticks integer,p_expelled boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.orchard_maze_rounds%ROWTYPE; cur integer; g integer:=0; s jsonb; at jsonb;
 entrances jsonb:='{"meadow":{"x":10,"y":12},"wood":{"x":3,"y":10},"ravine":{"x":3,"y":6},"lair":{"x":12,"y":19}}';
BEGIN
 SELECT * INTO r FROM public.orchard_maze_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Harvest not found'; END IF;
 IF p_energy<0 OR p_energy>300 OR p_ticks<0 OR p_ticks>3000 THEN RAISE EXCEPTION 'Invalid harvest'; END IF;
 IF r.settled_at IS NULL AND (now()<r.started_at+p_ticks*interval '0.2 seconds'-interval '1 second' OR now()>r.started_at+interval '20 minutes') THEN RAISE EXCEPTION 'Harvest timing is invalid'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO cur FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF cur IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',cur,'gained',r.gained,'state',s); END IF;
 IF s->>'zone'<>r.world_zone THEN RAISE EXCEPTION 'The land changed during this harvest'; END IF;
 g:=greatest(0,least(p_energy,100-cur));
 INSERT INTO public.orchard_harvests(user_id,tree,day,energy) VALUES(p_user,r.tree,(now() AT TIME ZONE 'UTC')::date,g) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN g:=0; END IF;
 UPDATE public.profiles SET monere_energy=cur+g WHERE user_id=p_user;
 IF p_expelled THEN at:=entrances->r.world_zone; s:=public.treasure_v4_reveal(s||at||'{"pet":null}'::jsonb); UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user; END IF;
 UPDATE public.orchard_maze_rounds SET settled_at=now(),collected_energy=p_energy,gained=g,expelled=p_expelled WHERE id=r.id;
 RETURN jsonb_build_object('energy',cur+g,'gained',g,'state',s);
END $$;
REVOKE ALL ON FUNCTION public.orchard_maze_settle(uuid,uuid,integer,integer,boolean) FROM public,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.orchard_maze_settle(uuid,uuid,integer,integer,boolean) TO service_role;