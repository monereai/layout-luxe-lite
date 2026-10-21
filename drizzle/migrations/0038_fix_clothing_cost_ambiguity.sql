CREATE OR REPLACE FUNCTION public.wardrobe_action(p_action text, p_id text DEFAULT NULL, p_equipped jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
 u uuid := auth.uid(); s jsonb; owned text[]; spent int; eq jsonb := '{}'::jsonb; v_cost int := 0; bal int;
 free_ boolean := public.is_sandbox_admin(); c public.clothing_catalog; combo public.clothing_combinations;
 missing text[]; slot text; item text; gift text; flag text;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.user_wardrobes(user_id) VALUES (u) ON CONFLICT DO NOTHING;
 SELECT w.shop_state INTO s FROM public.user_wardrobes w WHERE w.user_id = u FOR UPDATE;
 owned := coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(s->'owned','[]'::jsonb))), '{}');
 spent := coalesce((s->>'spent')::int, 0);
 IF p_action = 'buy' THEN
  IF p_id IS NULL OR btrim(p_id) = '' THEN RAISE EXCEPTION 'Invalid clothing ID'; END IF;
  SELECT catalog.* INTO c FROM public.clothing_catalog catalog WHERE catalog.id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown item'; END IF;
  v_cost := CASE WHEN p_id = ANY(owned) THEN 0 ELSE coalesce(c.cost,0) END;
  IF NOT (p_id = ANY(owned)) THEN
   IF c.cost IS NULL OR c.cost < 0 THEN RAISE EXCEPTION 'Clothing price unavailable'; END IF;
   IF NOT free_ THEN
    SELECT p.monere_points INTO bal FROM public.profiles p WHERE p.user_id = u FOR UPDATE;
    IF coalesce(bal,0) - spent < v_cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
    UPDATE public.profiles SET monere_points = monere_points - v_cost WHERE user_id = u;
   END IF;
   owned := array_append(owned,p_id);
  END IF;
  s := jsonb_set(s,'{equipped}',coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object(CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END,p_id));
 ELSIF p_action = 'buy_combo' THEN
  IF p_id IS NULL OR btrim(p_id) = '' THEN RAISE EXCEPTION 'Invalid clothing ID'; END IF;
  SELECT combos.* INTO combo FROM public.clothing_combinations combos WHERE combos.id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown combination'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.clothing_catalog cat WHERE cat.id=combo.hat AND cat.category='hat') OR NOT EXISTS(SELECT 1 FROM public.clothing_catalog cat WHERE cat.id=combo.outfit AND cat.category='costume') OR NOT EXISTS(SELECT 1 FROM public.clothing_catalog cat WHERE cat.id=combo.footwear AND cat.category='footwear') THEN RAISE EXCEPTION 'Invalid combination'; END IF;
  missing := ARRAY(SELECT x FROM unnest(ARRAY[combo.hat,combo.outfit,combo.footwear]) x WHERE NOT (x = ANY(owned)));
  IF EXISTS(SELECT 1 FROM public.clothing_catalog cat WHERE cat.id=ANY(missing) AND (cat.cost IS NULL OR cat.cost<0)) THEN RAISE EXCEPTION 'Clothing price unavailable'; END IF;
  SELECT coalesce(sum(cat.cost),0) INTO v_cost FROM public.clothing_catalog cat WHERE cat.id = ANY(missing);
  v_cost := CASE WHEN v_cost > 0 THEN ceil(v_cost * 1.25 / 5.0)::int * 5 ELSE 0 END;
  IF v_cost > 0 AND NOT free_ THEN
   SELECT p.monere_points INTO bal FROM public.profiles p WHERE p.user_id=u FOR UPDATE;
   IF coalesce(bal,0)-spent < v_cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
   UPDATE public.profiles SET monere_points=monere_points-v_cost WHERE user_id=u;
  END IF;
  owned := owned || missing;
  s := jsonb_set(s,'{equipped}',coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object('hat',combo.hat,'outfit',combo.outfit,'footwear',combo.footwear));
 ELSIF p_action = 'equip' THEN
  IF jsonb_typeof(p_equipped) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid outfit'; END IF;
  FOR slot,item IN SELECT key,value #>> '{}' FROM jsonb_each(p_equipped) LOOP
   IF slot NOT IN ('hat','outfit','glasses','accessory','footwear') THEN CONTINUE; END IF;
   IF item IS NULL THEN CONTINUE; END IF;
   IF jsonb_typeof(p_equipped->slot) IS DISTINCT FROM 'string' OR btrim(item)='' THEN RAISE EXCEPTION 'Invalid clothing ID'; END IF;
   SELECT cat.* INTO c FROM public.clothing_catalog cat WHERE cat.id=item;
   IF NOT FOUND OR NOT(item=ANY(owned)) OR (CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END)<>slot THEN RAISE EXCEPTION 'Item not owned'; END IF;
   -- Equipping an owned item is always free and never evaluates a purchase price.
   eq := eq || jsonb_build_object(slot,item);
  END LOOP;
  s := jsonb_set(s,'{equipped}',eq);
 ELSIF p_action IN ('gift_mystery','gift_jigsaw') THEN
  flag := CASE WHEN p_action='gift_mystery' THEN 'mysteryGift' ELSE 'jigsawReward' END;
  IF s ? flag THEN RETURN s; END IF;
  IF p_action='gift_mystery' AND (SELECT count(*) FROM public.care_game_rounds WHERE user_id=u AND kind='find' AND completed)<6 THEN RAISE EXCEPTION 'Complete every map first'; END IF;
  IF p_action='gift_jigsaw' AND (SELECT count(DISTINCT size) FROM public.care_game_rounds WHERE user_id=u AND kind='jigsaw' AND completed AND size IN (3,4,5,6))<4 THEN RAISE EXCEPTION 'Finish every jigsaw first'; END IF;
  SELECT cat.id INTO gift FROM public.clothing_catalog cat WHERE cat.category IN ('hat','costume','footwear','accessory') AND NOT(cat.id=ANY(owned)) ORDER BY random() LIMIT 1;
  IF gift IS NOT NULL THEN owned:=array_append(owned,gift); END IF;
  s:=s || jsonb_build_object(flag,coalesce(gift,'all-owned'));
  IF p_action='gift_mystery' AND gift IS NOT NULL THEN
   SELECT cat.* INTO c FROM public.clothing_catalog cat WHERE cat.id=gift;
   s:=jsonb_set(s,'{equipped}',coalesce(s->'equipped','{}'::jsonb) || jsonb_build_object(CASE WHEN c.category='costume' THEN 'outfit' ELSE c.category END,gift));
  END IF;
 ELSIF p_action='reset' THEN
  IF NOT(public.has_role(u,'admin') OR public.has_role(u,'tester') OR free_) THEN RAISE EXCEPTION 'Admin or tester access required'; END IF;
  s:='{"owned":[],"spent":0,"equipped":{}}'::jsonb; owned:='{}';
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'Unknown action';
 END IF;
 s:=jsonb_set(s,'{owned}',to_jsonb(owned));
 UPDATE public.user_wardrobes SET shop_state=s,updated_at=now() WHERE user_id=u;
 RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.wardrobe_action(text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.wardrobe_action(text,text,jsonb) TO authenticated;