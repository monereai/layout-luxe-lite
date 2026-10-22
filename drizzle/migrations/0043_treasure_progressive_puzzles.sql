CREATE FUNCTION public.treasure_v2_normalize(s jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE r jsonb; t jsonb:='[]'; z text; unlocked jsonb:='["meadow"]';
BEGIN
 SELECT coalesce(jsonb_agg(value),'[]') INTO r FROM jsonb_array_elements(coalesce(s->'relics','[]')) WHERE value #>> '{}' IN ('cat-stone','daisy-seal','bridge-coin','oak-heart','fern-scroll','wisdom-star');
 IF r ? 'cat-stone' THEN t:=t || '"magnifying-glass"'::jsonb; END IF; IF r ? 'oak-heart' THEN t:=t || '"lantern"'::jsonb; END IF;
 IF r @> '["cat-stone","daisy-seal","bridge-coin"]'::jsonb THEN unlocked:=unlocked || '"forest"'::jsonb; END IF;
 IF r @> '["oak-heart","fern-scroll"]'::jsonb AND unlocked ? 'forest' THEN unlocked:=unlocked || '"sky"'::jsonb; END IF;
 IF NOT(s ? 'version') THEN
  s:=s || jsonb_build_object('fragments',CASE WHEN r ?| ARRAY['oak-heart','fern-scroll','wisdom-star'] THEN '["root-fragment","pool-fragment"]'::jsonb ELSE '[]'::jsonb END,'gates',CASE WHEN r ?| ARRAY['oak-heart','fern-scroll','wisdom-star'] THEN '["forest-gate"]'::jsonb ELSE '[]'::jsonb END,'landmarks',CASE WHEN r ? 'wisdom-star' THEN '["roots","pool","dawn","ruins"]'::jsonb ELSE '[]'::jsonb END,'matched',CASE WHEN r ? 'wisdom-star' THEN '[0,1,2,3,4,5,6,7]'::jsonb ELSE '[]'::jsonb END,'first',NULL,'wind',0,'pinned',false);
 END IF;
 z:=s->>'zone'; IF NOT(unlocked ? z) THEN z:='meadow'; s:=s || '{"x":10,"y":12}'::jsonb; END IF;
 IF NOT public.treasure_walkable(z,(s->>'x')::int,(s->>'y')::int) OR (z='forest' AND (s->>'x')::int=10 AND NOT(s->'gates' ? 'forest-gate')) THEN s:=s || jsonb_build_object('x',CASE WHEN z='meadow' THEN 10 ELSE 3 END,'y',CASE WHEN z='meadow' THEN 12 ELSE 10 END); END IF;
 RETURN s || jsonb_build_object('version',2,'zone',z,'relics',r,'tools',t,'gear',coalesce((SELECT jsonb_agg(g) FROM jsonb_array_elements(coalesce(s->'gear',t)) g WHERE t ? (g #>> '{}')),'[]'::jsonb),'unlocked',unlocked,'pet',coalesce(s->'pet',jsonb_build_object('x',(s->>'x')::int-1,'y',(s->>'y')::int)));
END $$;
REVOKE ALL ON FUNCTION public.treasure_v2_normalize(jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.treasure_v2_action(p_action text,p_x int DEFAULT NULL,p_y int DEFAULT NULL,p_id text DEFAULT NULL,p_gear jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; z text; x int; y int; nx int; wind int; r jsonb; reward jsonb; l jsonb; first_tile int; tile int; symbols int[]:=ARRAY[0,1,2,3,2,0,3,1]; catalog jsonb:='[{"id":"cat-stone","zone":"meadow","x":11,"y":10,"tool":"magnifying-glass"},{"id":"daisy-seal","zone":"meadow","x":7,"y":6},{"id":"bridge-coin","zone":"meadow","x":12,"y":20},{"id":"oak-heart","zone":"forest","x":12,"y":6,"tool":"lantern"},{"id":"fern-scroll","zone":"forest","x":7,"y":10},{"id":"wisdom-star","zone":"sky","x":12,"y":10}]';
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.treasure_saves(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT public.treasure_v2_normalize(ts.state) INTO s FROM public.treasure_saves ts WHERE ts.user_id=u FOR UPDATE;
 z:=s->>'zone'; x:=(s->>'x')::int; y:=(s->>'y')::int;
 IF p_action='move' THEN
  IF p_x IS NULL OR p_y IS NULL OR abs(x-p_x)+abs(y-p_y)<>1 OR NOT public.treasure_walkable(z,p_x,p_y) OR (z='forest' AND p_x=10 AND NOT(s->'gates' ? 'forest-gate')) THEN RAISE EXCEPTION 'Blocked path'; END IF;
  nx:=p_x; wind:=coalesce((s->>'wind')::int,0);
  IF z='sky' AND p_x=14 AND p_y BETWEEN 9 AND 12 THEN wind:=wind+1; IF wind%2=1 THEN nx:=nx-1; END IF; END IF;
  IF NOT coalesce((s->>'pinned')::boolean,false) THEN s:=jsonb_set(s,'{pet}',jsonb_build_object('x',x,'y',y)); END IF;
  s:=s || jsonb_build_object('x',nx,'y',p_y,'wind',wind);
  IF z='forest' AND nx=8 AND p_y=10 AND (s->'pet'->>'x')::int=7 AND (s->'pet'->>'y')::int=10 AND NOT(s->'gates' ? 'forest-gate') THEN s:=jsonb_set(s,'{gates}',s->'gates' || '"forest-gate"'::jsonb); END IF;
 ELSIF p_action='pet' THEN s:=jsonb_set(s,'{pinned}',to_jsonb(NOT coalesce((s->>'pinned')::boolean,false)));
 ELSIF p_action='inspect' THEN
  SELECT value INTO l FROM jsonb_array_elements('[{"id":"roots","zone":"forest","x":5,"y":5,"fragment":"root-fragment"},{"id":"pool","zone":"forest","x":18,"y":19,"fragment":"pool-fragment"},{"id":"dawn","zone":"sky","x":12,"y":8},{"id":"ruins","zone":"sky","x":17,"y":7}]'::jsonb) WHERE value->>'id'=p_id;
  IF l IS NULL OR l->>'zone'<>z OR abs(x-(l->>'x')::int)+abs(y-(l->>'y')::int)>1 THEN RAISE EXCEPTION 'Reach the landmark first'; END IF;
  IF p_id='ruins' AND NOT(s->'landmarks' ? 'dawn') THEN RAISE EXCEPTION 'Read the Dawn Circle first'; END IF;
  IF NOT(s->'landmarks' ? p_id) THEN s:=jsonb_set(s,'{landmarks}',s->'landmarks' || to_jsonb(p_id)); END IF;
  IF l ? 'fragment' AND NOT(s->'fragments' ? (l->>'fragment')) THEN s:=jsonb_set(s,'{fragments}',s->'fragments' || to_jsonb(l->>'fragment')); END IF;
 ELSIF p_action='match' THEN
  IF z<>'sky' OR abs(x-12)+abs(y-10)>1 OR NOT(s->'landmarks' ? 'ruins') OR p_id IS NULL OR p_id !~ '^[0-7]$' THEN RAISE EXCEPTION 'Reach the puzzle after reading both landmarks'; END IF;
  tile:=p_id::int; first_tile:=(s->>'first')::int;
  IF s->'matched' @> jsonb_build_array(tile) OR first_tile=tile THEN RAISE EXCEPTION 'Choose another tile'; END IF;
  IF first_tile IS NULL THEN s:=jsonb_set(s,'{first}',to_jsonb(tile)); ELSE
   IF symbols[first_tile+1]=symbols[tile+1] THEN s:=jsonb_set(s,'{matched}',s->'matched' || jsonb_build_array(first_tile,tile)); END IF;
   s:=jsonb_set(s,'{first}','null'::jsonb);
  END IF;
 ELSIF p_action='collect' THEN
  SELECT value INTO r FROM jsonb_array_elements(catalog) WHERE value->>'id'=p_id;
  IF r IS NULL OR r->>'zone'<>z OR abs(x-(r->>'x')::int)+abs(y-(r->>'y')::int)>1 THEN RAISE EXCEPTION 'Treasure out of reach'; END IF;
  IF z='forest' AND (NOT(s->'gear' ? 'magnifying-glass') OR NOT(s->'fragments' @> '["root-fragment","pool-fragment"]'::jsonb)) THEN RAISE EXCEPTION 'Find both Key Fragments and equip the Magnifying Glass'; END IF;
  IF z='sky' AND (NOT(s->'gear' ? 'lantern') OR jsonb_array_length(s->'matched')<>8 OR NOT(s->'landmarks' ? 'ruins')) THEN RAISE EXCEPTION 'Solve all four matching pairs first'; END IF;
  IF NOT(s->'relics' ? p_id) THEN
   s:=jsonb_set(s,'{relics}',s->'relics' || to_jsonb(p_id));
   IF r ? 'tool' AND NOT(s->'tools' ? (r->>'tool')) THEN s:=jsonb_set(s,'{tools}',s->'tools' || to_jsonb(r->>'tool')); s:=jsonb_set(s,'{gear}',s->'gear' || to_jsonb(r->>'tool')); END IF;
  END IF;
 ELSIF p_action='gear' THEN
  IF jsonb_typeof(p_gear) IS DISTINCT FROM 'array' OR jsonb_array_length(p_gear)>2 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_gear) g WHERE jsonb_typeof(g)<>'string' OR NOT(s->'tools' ? (g #>> '{}'))) THEN RAISE EXCEPTION 'Tool not owned'; END IF;
  s:=jsonb_set(s,'{gear}',p_gear);
 ELSIF p_action='portal' THEN
  IF NOT((z='meadow' AND p_id='forest' AND abs(x-21)+abs(y-10)<=1) OR (z='forest' AND p_id='meadow' AND abs(x-2)+abs(y-10)<=1) OR (z='forest' AND p_id='sky' AND abs(x-21)+abs(y-10)<=1) OR (z='sky' AND p_id='forest' AND abs(x-2)+abs(y-10)<=1)) THEN RAISE EXCEPTION 'Reach the portal first'; END IF;
  IF NOT(s->'unlocked' ? p_id) THEN RAISE EXCEPTION 'Open every chest in the previous stage'; END IF;
  nx:=CASE WHEN p_id='meadow' OR z='sky' THEN 20 ELSE 3 END;
  s:=s || jsonb_build_object('zone',p_id,'x',nx,'y',10,'pet',jsonb_build_object('x',nx-1,'y',10),'pinned',false);
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'Unknown action'; END IF;
 s:=public.treasure_v2_normalize(s);
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 IF p_action='collect' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(catalog) c WHERE c->>'zone'=z AND NOT(s->'relics' ? (c->>'id'))) THEN reward:=public.wardrobe_action('gift_treasure',z,NULL); END IF;
 RETURN jsonb_build_object('state',s,'wardrobe',reward);
END $$;
REVOKE ALL ON FUNCTION public.treasure_v2_action(text,int,int,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v2_action(text,int,int,text,jsonb) TO authenticated;
CREATE FUNCTION public.treasure_v2_travel(p_steps jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE step jsonb; result jsonb; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF; IF jsonb_typeof(p_steps) IS DISTINCT FROM 'array' OR jsonb_array_length(p_steps)>32 THEN RAISE EXCEPTION 'Invalid path'; END IF; FOR step IN SELECT value FROM jsonb_array_elements(p_steps) LOOP IF jsonb_typeof(step->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(step->'y') IS DISTINCT FROM 'number' OR (step->>'x')::numeric<>trunc((step->>'x')::numeric) OR (step->>'y')::numeric<>trunc((step->>'y')::numeric) THEN RAISE EXCEPTION 'Invalid step'; END IF; result:=public.treasure_v2_action('move',(step->>'x')::int,(step->>'y')::int); END LOOP; RETURN coalesce(result,public.treasure_v2_action('status')); END $$;
REVOKE ALL ON FUNCTION public.treasure_v2_travel(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v2_travel(jsonb) TO authenticated;
DO $migration$ DECLARE definition text; old_condition text; new_condition text; BEGIN
 definition:=pg_get_functiondef('public.wardrobe_action(text,text,jsonb)'::regprocedure);
 old_condition:='(ts.state->''relics'') @> CASE p_id WHEN ''meadow'' THEN ''["cat-stone","daisy-seal","bridge-coin","meadow-feather","garden-key","sunflower-gem"]''::jsonb WHEN ''forest'' THEN ''["oak-heart","fern-scroll","firefly-jar","pool-pearl","moss-compass","root-crown"]''::jsonb ELSE ''["sun-medallion","cloud-quill","starlight-crystal","sky-harp","eagle-sigil","wisdom-star"]''::jsonb END';
 new_condition:='(' || old_condition || ' OR ((ts.state->>''version'')=''2'' AND (ts.state->''relics'') @> CASE p_id WHEN ''meadow'' THEN ''["cat-stone","daisy-seal","bridge-coin"]''::jsonb WHEN ''forest'' THEN ''["oak-heart","fern-scroll"]''::jsonb ELSE ''["wisdom-star"]''::jsonb END))';
 IF position(old_condition IN definition)=0 THEN RAISE EXCEPTION 'Relic reward branch unavailable'; END IF;
 EXECUTE replace(definition,old_condition,new_condition);
END $migration$;