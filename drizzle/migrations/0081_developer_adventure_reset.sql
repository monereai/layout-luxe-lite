CREATE OR REPLACE FUNCTION public.treasure_dev_reset() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; rs jsonb;
BEGIN
 IF u IS NULL OR lower(coalesce(auth.jwt()->>'email','')) <> 'carlhillyard@icloud.com' OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=u AND role::text IN ('admin','tester')) THEN RAISE EXCEPTION 'Developer access required'; END IF;
 -- Lock/invalidate rounds before the save, matching settlement lock order. Never clear reward history.
 UPDATE public.orchard_maze_rounds SET settled_at=now() WHERE user_id=u AND settled_at IS NULL;
 UPDATE public.garden_barrel_rounds SET settled_at=now() WHERE user_id=u AND settled_at IS NULL;
 UPDATE public.connie_arcade_rounds SET settled_at=now() WHERE user_id=u AND settled_at IS NULL;
 PERFORM 1 FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 SELECT jsonb_agg(jsonb_build_object('i',t.i,'o',(SELECT jsonb_agg(k ORDER BY random()+0*t.i) FROM generate_series(0,2) k))) INTO rs FROM (SELECT g AS i FROM generate_series(0,15) g ORDER BY random() LIMIT 7) t;
 s:=public.treasure_v4_reveal(jsonb_build_object('version',3,'zone','meadow','x',10,'y',12,'scrolls','[]'::jsonb,'gates','[]'::jsonb,'duel',0,'rescued',false,'gear','[]'::jsonb,'items','[]'::jsonb,'quests','[]'::jsonb,'met','[]'::jsonb,'dug','[]'::jsonb,'lily',0,'pet',null,'fog','{}'::jsonb,'riddles',rs));
 s:=s || jsonb_build_object('huntSpots',public.treasure_draw_hunt(s));
 INSERT INTO public.treasure_saves(user_id,state,updated_at) VALUES(u,s,now()) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at;
 RETURN jsonb_build_object('state',s,'points',0,'griffin',false);
END $$;
REVOKE ALL ON FUNCTION public.treasure_dev_reset() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.treasure_dev_reset() TO authenticated;
COMMENT ON FUNCTION public.treasure_dev_reset() IS 'Developer-only self reset. Preserves balances, owned items, daily harvest history and one-time reward ledgers; cancels unfinished adventure mini-game rounds.';