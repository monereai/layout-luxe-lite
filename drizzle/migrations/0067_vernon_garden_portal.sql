CREATE OR REPLACE FUNCTION public.treasure_v6_can_step(s jsonb, x integer, y integer) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
BEGIN
 IF s->>'zone'='garden' THEN RETURN coalesce(s->'quests' ? 'vernon',false) AND x BETWEEN 2 AND 21 AND y BETWEEN 2 AND 21 AND NOT((x BETWEEN 9 AND 14 AND y BETWEEN 9 AND 14) OR (x<=4 AND y BETWEEN 5 AND 16) OR (x>=17 AND y<=5)); END IF;
 IF s->>'zone'='meadow' AND y BETWEEN 21 AND 29 THEN RETURN CASE WHEN y<=23 THEN x BETWEEN 11 AND 13 ELSE x BETWEEN 4 AND 19 END; END IF;
 RETURN public.treasure_v4_can_step(s,x,y);
END $$;
REVOKE ALL ON FUNCTION public.treasure_v6_can_step(jsonb,integer,integer) FROM PUBLIC,anon,authenticated;
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure) INTO definition;
 definition:=replace(definition,'public.treasure_v5_action(', 'public.treasure_v6_action(');
 definition:=replace(definition,'public.treasure_v4_can_step(s,p_x,p_y)','public.treasure_v6_can_step(s,p_x,p_y)');
 definition:=replace(definition,'"meadow":[{"x":21,"y":10,"t":"wood","ax":3,"ay":10,"f":true}]','"garden":[{"x":12,"y":21,"t":"meadow","ax":12,"ay":27,"f":false}],"meadow":[{"x":21,"y":10,"t":"wood","ax":3,"ay":10,"f":true},{"x":12,"y":28,"t":"garden","ax":12,"ay":20,"f":false}]');
 definition:=replace(definition,'ELSIF p_action=''collect'' THEN','ELSIF p_action=''collect'' THEN IF z=''garden'' THEN RAISE EXCEPTION ''No scroll in the garden''; END IF;');
 definition:=replace(definition,'ELSIF p_action=''answer'' THEN','ELSIF p_action=''answer'' THEN IF z=''garden'' THEN RAISE EXCEPTION ''No riddle in the garden''; END IF;');
 definition:=replace(definition,'IF p IS NULL THEN RAISE EXCEPTION ''Reach the portal first''; END IF;','IF p IS NULL THEN RAISE EXCEPTION ''Reach the portal first''; END IF; IF (p_id=''garden'' OR z=''garden'') AND NOT(s->''quests'' ? ''vernon'') THEN RAISE EXCEPTION ''Return all three seeds to Vernon first''; END IF;');
 IF position('"seed-1":["wood",7,8]' IN definition)=0 OR position('"t":"garden"' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected adventure definition'; END IF;
 EXECUTE definition;
END $migration$;
REVOKE ALL ON FUNCTION public.treasure_v6_action(text,integer,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v6_action(text,integer,integer,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.treasure_v6_travel(p_steps jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE step jsonb; result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF jsonb_typeof(p_steps) IS DISTINCT FROM 'array' OR jsonb_array_length(p_steps)>32 THEN RAISE EXCEPTION 'Invalid path'; END IF;
 FOR step IN SELECT value FROM jsonb_array_elements(p_steps) LOOP
 IF jsonb_typeof(step->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(step->'y') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid step'; END IF;
 result:=public.treasure_v6_action('move',(step->>'x')::int,(step->>'y')::int,NULL);
 END LOOP;
 IF result IS NULL THEN result:=public.treasure_v6_action('status'); END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.treasure_v6_travel(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v6_travel(jsonb) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';