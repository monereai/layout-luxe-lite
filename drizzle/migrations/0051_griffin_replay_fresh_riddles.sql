CREATE OR REPLACE FUNCTION public.treasure_restart() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; rs jsonb; old int[];
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT ts.state INTO s FROM public.treasure_saves ts WHERE ts.user_id=u FOR UPDATE;
 IF NOT coalesce((s->>'rescued')::boolean,false) OR coalesce((s->>'duel')::int,0)<>3 THEN RAISE EXCEPTION 'Complete the quest before starting again'; END IF;
 SELECT coalesce(array_agg((r->>'i')::int),'{}') INTO old FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s->'riddles')='array' THEN s->'riddles' ELSE '[]'::jsonb END) r;
 -- Riddles from the last playthrough go to the back of the draw, so a replay gets new ones.
 SELECT jsonb_agg(jsonb_build_object('i',t.i,'o',(SELECT jsonb_agg(k ORDER BY random()+0*t.i) FROM generate_series(0,2) k))) INTO rs FROM (SELECT g AS i FROM generate_series(0,15) g ORDER BY (g=ANY(old)), random() LIMIT 7) t;
 s:=public.treasure_v4_reveal(jsonb_build_object('version',3,'zone','meadow','x',10,'y',12,'scrolls','[]'::jsonb,'gates','[]'::jsonb,'duel',0,'rescued',false,'gear','[]'::jsonb,'items','[]'::jsonb,'quests','[]'::jsonb,'met','[]'::jsonb,'dug','[]'::jsonb,'lily',0,'pet',null,'fog','{}'::jsonb,'riddles',rs));
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 RETURN jsonb_build_object('state',s,'points',0,'griffin',false);
END $$;
REVOKE ALL ON FUNCTION public.treasure_restart() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.treasure_restart() TO authenticated;