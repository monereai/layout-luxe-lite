-- Clothing: purchases, gifts and equips are decided only by the server.
CREATE TABLE IF NOT EXISTS public.clothing_catalog (id text PRIMARY KEY, category text NOT NULL, cost integer NOT NULL);
GRANT SELECT ON public.clothing_catalog TO authenticated;
GRANT ALL ON public.clothing_catalog TO service_role;
ALTER TABLE public.clothing_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read clothing catalog" ON public.clothing_catalog FOR SELECT TO authenticated USING (true);
INSERT INTO public.clothing_catalog(id,category,cost) VALUES ('amber-snapback','hat',300),('cozy-beanie','hat',300),('detective-hat','hat',300),('explorer-hat','hat',300),('cowboy-hat','hat',300),('scholar-cap','hat',300),('wizard-hat','hat',800),('top-hat','hat',800),('halo','hat',800),('crown','hat',800),('party-hat','hat',300),('viking-helmet','hat',800),('crisp-sneakers','footwear',300),('skate-classics','footwear',300),('trail-boots','footwear',300),('soccer-cleats','footwear',800),('golden-sliders','footwear',800),('knight-boots','footwear',800),('rain-boots','footwear',300),('rocket-boots','footwear',800),('bandana','accessory',300),('bow-tie','accessory',300),('friendship-beads','accessory',300),('cozy-scarf','accessory',300),('gold-chain','accessory',800),('gold-medal','accessory',800),('shell-necklace','accessory',300),('sunglasses','glasses',300),('round-specs','glasses',300),('star-shades','glasses',300),('storm-cloak','costume',800),('crimson-cape','costume',800),('emerald-cloak','costume',800),('galaxy-cape','costume',800),('flame-cape','costume',800),('arctic-cloak','costume',800),('hero-cape','costume',800),('shadow-cloak','costume',800),('knight-cape','costume',800),('phoenix-wings','costume',800),('angel-wings','costume',800),('royal-cape','costume',800),('pirate-coat','costume',800),('astro-suit','costume',800)
ON CONFLICT (id) DO UPDATE SET category=excluded.category, cost=excluded.cost;

CREATE TABLE IF NOT EXISTS public.clothing_combinations (id text PRIMARY KEY, hat text NOT NULL, outfit text NOT NULL, footwear text NOT NULL);
GRANT SELECT ON public.clothing_combinations TO authenticated;
GRANT ALL ON public.clothing_combinations TO service_role;
ALTER TABLE public.clothing_combinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read clothing combinations" ON public.clothing_combinations FOR SELECT TO authenticated USING (true);
INSERT INTO public.clothing_combinations(id,hat,outfit,footwear) VALUES ('crown-hero-sneakers','crown','hero-cape','crisp-sneakers'),('explorer-emerald-boots','explorer-hat','emerald-cloak','trail-boots'),('wizard-galaxy-skates','wizard-hat','galaxy-cape','skate-classics'),('beanie-arctic-sneakers','cozy-beanie','arctic-cloak','crisp-sneakers'),('viking-storm-boots','viking-helmet','storm-cloak','knight-boots'),('party-flame-sliders','party-hat','flame-cape','golden-sliders'),('halo-galaxy-rocket','halo','galaxy-cape','rocket-boots'),('tophat-pirate-rain','top-hat','pirate-coat','rain-boots')
ON CONFLICT (id) DO UPDATE SET hat=excluded.hat, outfit=excluded.outfit, footwear=excluded.footwear;

REVOKE INSERT, UPDATE, DELETE ON public.user_wardrobes FROM authenticated, anon;
DROP POLICY IF EXISTS "Create own wardrobe" ON public.user_wardrobes;
DROP POLICY IF EXISTS "Save own wardrobe" ON public.user_wardrobes;

CREATE OR REPLACE FUNCTION public.wardrobe_action(p_action text, p_id text DEFAULT NULL, p_equipped jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  u uuid := auth.uid(); s jsonb; owned text[]; spent int; eq jsonb := '{}'::jsonb; cost int; bal int;
  free_ boolean := public.is_sandbox_admin(); c public.clothing_catalog; combo public.clothing_combinations;
  missing text[]; slot text; item text; gift text; flag text;
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO user_wardrobes(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  SELECT shop_state INTO s FROM user_wardrobes WHERE user_id = u FOR UPDATE;
  owned := coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(s->'owned','[]'::jsonb))), '{}');
  spent := coalesce((s->>'spent')::int, 0);
  IF p_action = 'buy' THEN
    SELECT * INTO c FROM clothing_catalog WHERE id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Unknown item'; END IF;
    IF NOT (p_id = ANY(owned)) THEN
      IF NOT free_ THEN
        SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
        IF coalesce(bal,0) - spent < c.cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
        UPDATE profiles SET monere_points = monere_points - c.cost WHERE user_id = u;
      END IF;
      owned := array_append(owned, p_id);
    END IF;
    s := jsonb_set(s, '{equipped}', coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object(CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END, p_id));
  ELSIF p_action = 'buy_combo' THEN
    SELECT * INTO combo FROM clothing_combinations WHERE id = p_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Unknown combination'; END IF;
    missing := ARRAY(SELECT x FROM unnest(ARRAY[combo.hat, combo.outfit, combo.footwear]) x WHERE NOT (x = ANY(owned)));
    SELECT coalesce(sum(cost),0) INTO cost FROM clothing_catalog WHERE id = ANY(missing);
    cost := CASE WHEN cost > 0 THEN ceil(cost * 1.25 / 5.0)::int * 5 ELSE 0 END;
    IF cost > 0 AND NOT free_ THEN
      SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
      IF coalesce(bal,0) - spent < cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
      UPDATE profiles SET monere_points = monere_points - cost WHERE user_id = u;
    END IF;
    owned := owned || missing;
    s := jsonb_set(s, '{equipped}', coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object('hat', combo.hat, 'outfit', combo.outfit, 'footwear', combo.footwear));
  ELSIF p_action = 'equip' THEN
    IF jsonb_typeof(p_equipped) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid outfit'; END IF;
    FOR slot, item IN SELECT key, value #>> '{}' FROM jsonb_each(p_equipped) LOOP
      IF slot NOT IN ('hat','outfit','glasses','accessory','footwear') THEN CONTINUE; END IF;
      IF item IS NULL THEN CONTINUE; END IF;
      SELECT * INTO c FROM clothing_catalog WHERE id = item;
      IF NOT FOUND OR NOT (item = ANY(owned)) OR (CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END) <> slot THEN RAISE EXCEPTION 'Item not owned'; END IF;
      eq := eq || jsonb_build_object(slot, item);
    END LOOP;
    s := jsonb_set(s, '{equipped}', eq);
  ELSIF p_action IN ('gift_mystery', 'gift_jigsaw') THEN
    flag := CASE WHEN p_action = 'gift_mystery' THEN 'mysteryGift' ELSE 'jigsawReward' END;
    IF s ? flag THEN RETURN s; END IF;
    IF p_action = 'gift_mystery' AND (SELECT count(*) FROM care_game_rounds WHERE user_id=u AND kind='find' AND completed) < 6 THEN RAISE EXCEPTION 'Complete every map first'; END IF;
    IF p_action = 'gift_jigsaw' AND (SELECT count(DISTINCT size) FROM care_game_rounds WHERE user_id=u AND kind='jigsaw' AND completed AND size IN (3,4,5,6)) < 4 THEN RAISE EXCEPTION 'Finish every jigsaw first'; END IF;
    SELECT id INTO gift FROM clothing_catalog WHERE category IN ('hat','costume','footwear','accessory') AND NOT (id = ANY(owned)) ORDER BY random() LIMIT 1;
    IF gift IS NOT NULL THEN owned := array_append(owned, gift); END IF;
    s := s || jsonb_build_object(flag, coalesce(gift, 'all-owned'));
    IF p_action = 'gift_mystery' AND gift IS NOT NULL THEN
      SELECT * INTO c FROM clothing_catalog WHERE id = gift;
      s := jsonb_set(s, '{equipped}', coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object(CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END, gift));
    END IF;
  ELSIF p_action = 'reset' THEN
    IF NOT (public.has_role(u,'admin') OR public.has_role(u,'tester') OR free_) THEN RAISE EXCEPTION 'Admin or tester access required'; END IF;
    s := '{"owned": [], "spent": 0, "equipped": {}}'::jsonb; owned := '{}';
  ELSIF p_action <> 'status' THEN RAISE EXCEPTION 'Unknown action';
  END IF;
  s := jsonb_set(s, '{owned}', to_jsonb(owned));
  UPDATE user_wardrobes SET shop_state = s, updated_at = now() WHERE user_id = u;
  RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.wardrobe_action(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.wardrobe_action(text, text, jsonb) TO authenticated;

-- Find Monere: the server hides the Mini-Moneres and checks each tap.
ALTER TABLE public.care_game_rounds ADD COLUMN IF NOT EXISTS spots jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.care_game_rounds ADD COLUMN IF NOT EXISTS last_reward_at timestamptz;

CREATE OR REPLACE FUNCTION public.care_start_round(p_kind text, p_size integer DEFAULT 3)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE r public.care_game_rounds; a integer[]; sp jsonb := '[]'::jsonb; x numeric; y numeric; tries int := 0; ok boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 IF p_kind NOT IN ('find','jigsaw') OR p_size NOT IN (3,4,5,6,7) OR (p_kind='find' AND p_size=7) THEN RAISE EXCEPTION 'Invalid game'; END IF;
 IF p_kind='jigsaw' THEN
  SELECT array_agg(i ORDER BY random()) INTO a FROM generate_series(0,p_size*p_size-1) i;
  IF a=ARRAY(SELECT generate_series(0,p_size*p_size-1)) THEN a[1]:=1; a[2]:=0; END IF;
 ELSE
  a:='{}';
  WHILE jsonb_array_length(sp) < 10 AND tries < 4000 LOOP
   tries := tries + 1;
   x := round((5 + random()*90)::numeric, 2); y := round((7 + random()*86)::numeric, 2);
   SELECT bool_and(sqrt(power((e->>'x')::numeric - x, 2) + power(((e->>'y')::numeric - y)*0.66, 2)) > 5) INTO ok FROM jsonb_array_elements(sp) e;
   IF coalesce(ok, true) THEN sp := sp || jsonb_build_array(jsonb_build_object('x', x, 'y', y, 'size', round((2 + random()*1.2)::numeric, 2), 'rot', floor(random()*360)::int)); END IF;
  END LOOP;
 END IF;
 INSERT INTO public.care_game_rounds(user_id,kind,size,initial_order,spots,last_reward_at) VALUES(auth.uid(),p_kind,p_size,a,sp,clock_timestamp()) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'order',r.initial_order,'spots',r.spots);
END; $function$;

CREATE OR REPLACE FUNCTION public.care_reward_piece(p_round uuid, p_spot integer, p_proof jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; gained integer:=0; sp jsonb; tx numeric; ty numeric;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game round not found'; END IF;
 IF p_spot IS NULL OR p_spot<0 OR p_spot>=(CASE WHEN r.kind='find' THEN 10 ELSE r.size*r.size END) THEN RAISE EXCEPTION 'Invalid spot'; END IF;
 IF r.kind='jigsaw' THEN
  a:=public.care_valid_order(r.initial_order,r.size,p_proof); IF a[p_spot+1]<>p_spot THEN RAISE EXCEPTION 'Place the piece correctly first'; END IF;
 ELSE
  sp := r.spots->p_spot;
  IF sp IS NULL OR jsonb_typeof(p_proof) IS DISTINCT FROM 'array' OR jsonb_array_length(p_proof)<>1 OR jsonb_array_length(p_proof->0)<>2 THEN RAISE EXCEPTION 'Tap the Mini-Monere to find it'; END IF;
  tx := (p_proof->0->>0)::numeric/100; ty := (p_proof->0->>1)::numeric/100;
  IF sqrt(power(tx-(sp->>'x')::numeric,2)+power((ty-(sp->>'y')::numeric)*0.66,2)) > (sp->>'size')::numeric + 1 THEN RAISE EXCEPTION 'That is not a Mini-Monere'; END IF;
  IF NOT (p_spot=ANY(r.rewarded_finds)) AND clock_timestamp() < coalesce(r.last_reward_at, r.created_at) + interval '400 milliseconds' THEN RAISE EXCEPTION 'Take a moment to look around'; END IF;
 END IF;
 state:=public.care_apply('sync');
 IF NOT r.completed AND NOT(p_spot=ANY(r.rewarded_finds)) THEN
  gained:=greatest(0,least(5,100-(state->>'energy')::integer));
  UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
  UPDATE public.care_game_rounds SET rewarded_finds=array_append(rewarded_finds,p_spot), last_reward_at=clock_timestamp() WHERE id=r.id;
 END IF;
 RETURN state||jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',0,'fullBonus',0);
END; $function$;

CREATE OR REPLACE FUNCTION public.care_finish_round(p_round uuid, p_proof jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; gained integer; final_energy integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game round not found'; END IF;
 IF r.completed THEN RETURN public.care_apply('sync'); END IF;
 IF jsonb_typeof(p_proof) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid round result'; END IF;
 IF r.kind='find' THEN
  IF (SELECT count(DISTINCT x) FROM unnest(r.rewarded_finds) x WHERE x BETWEEN 0 AND 9)<>10 THEN RAISE EXCEPTION 'Find all 10 Mini-Moneres first'; END IF;
 ELSE
  a:=public.care_valid_order(r.initial_order,r.size,p_proof);
  IF a<>ARRAY(SELECT generate_series(0,r.size*r.size-1)) THEN RAISE EXCEPTION 'Finish the puzzle first'; END IF;
 END IF;
 state:=public.care_apply('sync'); gained:=greatest(0,least(5,100-(state->>'energy')::integer));
 UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'game_round','round:'||r.id,5) ON CONFLICT(reference) DO NOTHING;
 UPDATE public.care_game_rounds SET completed=true WHERE id=r.id;
 SELECT monere_energy INTO final_energy FROM public.profiles WHERE user_id=auth.uid();
 RETURN state||jsonb_build_object('energy',final_energy,'energyAwarded',gained,'pointsAwarded',5,'fullBonus',0);
END; $function$;