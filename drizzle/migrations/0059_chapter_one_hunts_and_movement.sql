CREATE OR REPLACE FUNCTION public.treasure_hunt_pool() RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT '[["meadow",4,5],["meadow",8,16],["meadow",18,15],["meadow",17,7],["wood",5,7],["wood",12,8],["wood",10,5],["wood",19,9],["ravine",5,7],["ravine",9,8],["ravine",18,18],["ravine",14,16]]'::jsonb $$;
CREATE OR REPLACE FUNCTION public.treasure_draw_hunt(s jsonb) RETURNS jsonb LANGUAGE sql VOLATILE SET search_path=public AS $$ SELECT jsonb_agg(i) FROM (SELECT i FROM generate_series(0,11) i WHERE (public.treasure_hunt_pool()->i->>0='meadow' OR (public.treasure_hunt_pool()->i->>0='wood' AND s->'gates' ? 'meadow') OR (public.treasure_hunt_pool()->i->>0='ravine' AND s->'gates' ? 'wood')) ORDER BY random() LIMIT 3) spots $$;
DO $upgrade$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure);
 IF position('z:=s->>''zone'';' in definition)=0 THEN RAISE EXCEPTION 'Adventure initialization anchor missing'; END IF;
 definition:=replace(definition,'z:=s->>''zone'';', $patch$IF NOT(s ? 'huntSpots') THEN s:=s || jsonb_build_object('huntSpots',CASE WHEN coalesce(jsonb_array_length(s->'items'),0)=0 AND coalesce(jsonb_array_length(s->'gates'),0)=0 THEN public.treasure_draw_hunt(s) ELSE 'null'::jsonb END); END IF;
 FOR slot IN 0..2 LOOP
  IF jsonb_typeof(s->'huntSpots')='array' THEN q:=public.treasure_hunt_pool()->((s->'huntSpots'->>slot)::int);
   digs:=jsonb_set(digs,ARRAY[(ARRAY['m-frag','r-frag','l-frag'])[slot+1]],jsonb_build_array(q->>0,(q->>1)::int,(q->>2)::int,'fragment-'||(slot+1),0));
  END IF;
 END LOOP;
 z:=s->>'zone';$patch$);
 EXECUTE definition;
 definition:=pg_get_functiondef('public.treasure_restart()'::regprocedure);
 IF position('UPDATE public.treasure_saves' in definition)=0 THEN RAISE EXCEPTION 'Adventure restart anchor missing'; END IF;
 definition:=replace(definition,'UPDATE public.treasure_saves', 's:=s || jsonb_build_object(''huntSpots'',public.treasure_draw_hunt(s)); UPDATE public.treasure_saves');
 EXECUTE definition;
END $upgrade$;
ALTER TABLE public.treasure_saves ADD COLUMN IF NOT EXISTS last_sprint_at timestamptz, ADD COLUMN IF NOT EXISTS last_dash_at timestamptz;
CREATE OR REPLACE FUNCTION public.treasure_movement_boost(p_mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s public.treasure_saves%ROWTYPE; e int; cost int; allowed boolean:=false;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF p_mode NOT IN ('sprint','dash') THEN RAISE EXCEPTION 'Invalid movement mode'; END IF;
 SELECT * INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s.user_id IS NULL OR coalesce((s.state->>'rescued')::boolean,false) THEN RAISE EXCEPTION 'No active adventure'; END IF;
 PERFORM public.care_apply('sync');
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=u FOR UPDATE;
 cost:=CASE WHEN p_mode='dash' THEN 5 ELSE 1 END;
 IF e>=cost AND (CASE WHEN p_mode='dash' THEN s.last_dash_at IS NULL OR now()-s.last_dash_at>=interval '0.5 seconds' ELSE s.last_sprint_at IS NULL OR now()-s.last_sprint_at>=interval '1 second' END) THEN
  UPDATE public.profiles SET monere_energy=monere_energy-cost WHERE user_id=u; e:=e-cost; allowed:=true;
  UPDATE public.treasure_saves SET last_sprint_at=CASE WHEN p_mode='sprint' THEN now() ELSE last_sprint_at END,last_dash_at=CASE WHEN p_mode='dash' THEN now() ELSE last_dash_at END WHERE user_id=u;
 END IF;
 RETURN jsonb_build_object('allowed',allowed,'energy',e);
END $$;
REVOKE ALL ON FUNCTION public.treasure_movement_boost(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.treasure_movement_boost(text) TO authenticated;
NOTIFY pgrst, 'reload schema';