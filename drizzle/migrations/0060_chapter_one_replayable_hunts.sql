CREATE OR REPLACE FUNCTION public.treasure_refresh_hunt() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; today text:=to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD');
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s IS NULL OR s->>'zone'<>'lair' OR abs((s->>'x')::int-12)+abs((s->>'y')::int-10)>1 THEN RAISE EXCEPTION 'Reach the chapter door first'; END IF;
 IF s->>'huntDate' IS DISTINCT FROM today THEN
  s:=s || jsonb_build_object('huntSpots',public.treasure_draw_hunt(s),'huntDate',today,'items',coalesce((SELECT jsonb_agg(i) FROM jsonb_array_elements_text(s->'items') i WHERE i NOT IN ('fragment-1','fragment-2','fragment-3')),'[]'::jsonb),'dug',coalesce((SELECT jsonb_agg(i) FROM jsonb_array_elements_text(s->'dug') i WHERE i NOT IN ('m-frag','r-frag','l-frag')),'[]'::jsonb));
  UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 END IF;
 RETURN jsonb_build_object('state',s,'points',0,'griffin',false);
END $$;
REVOKE ALL ON FUNCTION public.treasure_refresh_hunt() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.treasure_refresh_hunt() TO authenticated;
NOTIFY pgrst,'reload schema';