CREATE TABLE public.treasure_saves (user_id uuid PRIMARY KEY, state jsonb NOT NULL DEFAULT '{"zone":"meadow","x":10,"y":12,"relics":[],"tools":[],"gear":[],"unlocked":["meadow"]}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.treasure_saves TO authenticated;
GRANT ALL ON public.treasure_saves TO service_role;
ALTER TABLE public.treasure_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own adventure" ON public.treasure_saves FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE FUNCTION public.treasure_walkable(z text,x int,y int) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT x BETWEEN 2 AND 21 AND y BETWEEN 2 AND 21 AND CASE WHEN z='meadow' THEN y<21 OR x BETWEEN 11 AND 13 WHEN z='forest' THEN NOT ((x BETWEEN 4 AND 8 AND y BETWEEN 12 AND 15) OR (x BETWEEN 14 AND 17 AND y BETWEEN 12 AND 15)) WHEN z='sky' THEN abs(x-12)+abs(y-11)<=17 ELSE false END $$;
REVOKE ALL ON FUNCTION public.treasure_walkable(text,int,int) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_walkable(text,int,int) TO authenticated;
DO $migration$
DECLARE definition text; branch text;
BEGIN
 definition := pg_get_functiondef('public.wardrobe_action(text,text,jsonb)'::regprocedure);
 branch := $branch$ELSIF p_action='gift_treasure' THEN
  IF p_id NOT IN ('meadow','forest','sky') OR p_id IS NULL THEN RAISE EXCEPTION 'Unknown relic set'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.treasure_saves ts WHERE ts.user_id=u AND (ts.state->'relics') @> CASE p_id WHEN 'meadow' THEN '["cat-stone","daisy-seal","bridge-coin","meadow-feather","garden-key","sunflower-gem"]'::jsonb WHEN 'forest' THEN '["oak-heart","fern-scroll","firefly-jar","pool-pearl","moss-compass","root-crown"]'::jsonb ELSE '["sun-medallion","cloud-quill","starlight-crystal","sky-harp","eagle-sigil","wisdom-star"]'::jsonb END) THEN RAISE EXCEPTION 'Complete the relic set first'; END IF;
  gift := CASE p_id WHEN 'meadow' THEN 'explorer-hat' WHEN 'forest' THEN 'emerald-cloak' ELSE 'trail-boots' END;
  IF NOT EXISTS(SELECT 1 FROM public.clothing_catalog cat WHERE cat.id=gift) THEN RAISE EXCEPTION 'Reward unavailable'; END IF;
  IF NOT(gift=ANY(owned)) THEN owned:=array_append(owned,gift); END IF;
  s:=s || jsonb_build_object('treasure_' || p_id,gift);
 ELSIF p_action='reset' THEN$branch$;
 IF position('ELSIF p_action=''reset'' THEN' IN definition)=0 THEN RAISE EXCEPTION 'Wardrobe branch unavailable'; END IF;
 EXECUTE replace(definition,'ELSIF p_action=''reset'' THEN',branch);
END $migration$;
CREATE FUNCTION public.treasure_action(p_action text,p_x int DEFAULT NULL,p_y int DEFAULT NULL,p_id text DEFAULT NULL,p_gear jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; z text; x int; y int; r jsonb; target text; reward jsonb; catalog jsonb := '[{"id":"cat-stone","zone":"meadow","x":11,"y":10,"tool":"magnifying-glass"},{"id":"daisy-seal","zone":"meadow","x":7,"y":6},{"id":"bridge-coin","zone":"meadow","x":12,"y":20},{"id":"meadow-feather","zone":"meadow","x":18,"y":15,"requires":"magnifying-glass"},{"id":"garden-key","zone":"meadow","x":5,"y":16},{"id":"sunflower-gem","zone":"meadow","x":16,"y":5},{"id":"oak-heart","zone":"forest","x":12,"y":6,"tool":"lantern"},{"id":"fern-scroll","zone":"forest","x":7,"y":10},{"id":"firefly-jar","zone":"forest","x":17,"y":8,"requires":"lantern"},{"id":"pool-pearl","zone":"forest","x":18,"y":19},{"id":"moss-compass","zone":"forest","x":11,"y":17,"requires":"magnifying-glass"},{"id":"root-crown","zone":"forest","x":5,"y":5},{"id":"sun-medallion","zone":"sky","x":12,"y":10},{"id":"cloud-quill","zone":"sky","x":8,"y":6},{"id":"starlight-crystal","zone":"sky","x":18,"y":7,"requires":"lantern"},{"id":"sky-harp","zone":"sky","x":6,"y":15},{"id":"eagle-sigil","zone":"sky","x":17,"y":17,"requires":"magnifying-glass"},{"id":"wisdom-star","zone":"sky","x":12,"y":20}]'::jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.treasure_saves(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT ts.state INTO s FROM public.treasure_saves ts WHERE ts.user_id=u FOR UPDATE;
 z:=s->>'zone'; x:=(s->>'x')::int; y:=(s->>'y')::int;
 IF p_action='move' THEN
  IF p_x IS NULL OR p_y IS NULL OR abs(x-p_x)+abs(y-p_y)<>1 OR NOT public.treasure_walkable(z,p_x,p_y) THEN RAISE EXCEPTION 'Blocked path'; END IF;
  s:=s || jsonb_build_object('x',p_x,'y',p_y);
 ELSIF p_action='collect' THEN
  SELECT value INTO r FROM jsonb_array_elements(catalog) WHERE value->>'id'=p_id;
  IF r IS NULL OR r->>'zone'<>z OR abs(x-(r->>'x')::int)+abs(y-(r->>'y')::int)>1 THEN RAISE EXCEPTION 'Treasure out of reach'; END IF;
  IF r ? 'requires' AND NOT (s->'gear' ? (r->>'requires')) THEN RAISE EXCEPTION 'Equip the required tool'; END IF;
  IF NOT(s->'relics' ? p_id) THEN s:=jsonb_set(s,'{relics}',s->'relics' || to_jsonb(p_id)); END IF;
  IF r ? 'tool' AND NOT(s->'tools' ? (r->>'tool')) THEN
   s:=jsonb_set(s,'{tools}',s->'tools' || to_jsonb(r->>'tool'));
   s:=jsonb_set(s,'{gear}',s->'gear' || to_jsonb(r->>'tool'));
  END IF;
  s:=jsonb_set(s,'{unlocked}',CASE WHEN s->'tools' ? 'lantern' THEN '["meadow","forest","sky"]'::jsonb WHEN s->'tools' ? 'magnifying-glass' THEN '["meadow","forest"]'::jsonb ELSE '["meadow"]'::jsonb END);
 ELSIF p_action='gear' THEN
  IF jsonb_typeof(p_gear) IS DISTINCT FROM 'array' OR jsonb_array_length(p_gear)>2 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_gear) g WHERE jsonb_typeof(g)<>'string' OR NOT(s->'tools' ? (g #>> '{}'))) THEN RAISE EXCEPTION 'Tool not owned'; END IF;
  s:=jsonb_set(s,'{gear}',p_gear);
 ELSIF p_action='portal' THEN
  target:=p_id;
  IF NOT((z='meadow' AND target='forest' AND abs(x-21)+abs(y-10)<=1) OR (z='forest' AND target='meadow' AND abs(x-2)+abs(y-10)<=1) OR (z='forest' AND target='sky' AND abs(x-21)+abs(y-10)<=1) OR (z='sky' AND target='forest' AND abs(x-2)+abs(y-10)<=1)) THEN RAISE EXCEPTION 'Reach the portal first'; END IF;
  IF target='forest' AND NOT(s->'tools' ? 'magnifying-glass') THEN RAISE EXCEPTION 'Find the Magnifying Glass first'; END IF;
  IF target='sky' AND NOT(s->'tools' ? 'lantern') THEN RAISE EXCEPTION 'Find the Lantern first'; END IF;
  s:=s || jsonb_build_object('zone',target,'x',CASE WHEN target='meadow' OR z='sky' THEN 20 ELSE 3 END,'y',10);
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'Unknown action'; END IF;
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 IF p_action='collect' AND (SELECT count(*) FROM jsonb_array_elements(catalog) c WHERE c->>'zone'=z AND s->'relics' ? (c->>'id'))=6 THEN
  reward:=public.wardrobe_action('gift_treasure',z,NULL);
 END IF;
 RETURN jsonb_build_object('state',s,'wardrobe',reward);
END $$;
REVOKE ALL ON FUNCTION public.treasure_action(text,int,int,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_action(text,int,int,text,jsonb) TO authenticated;