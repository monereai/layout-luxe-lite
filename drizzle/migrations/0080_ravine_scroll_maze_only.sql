DO $$
DECLARE fn text; definition text; marker text := 'ELSIF p_action=''collect'' THEN';
BEGIN
 FOREACH fn IN ARRAY ARRAY['treasure_v5_action','treasure_v6_action'] LOOP
  SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=fn;
  IF definition IS NULL OR position(marker in definition)=0 THEN RAISE EXCEPTION 'Missing collect branch in %',fn; END IF;
  definition:=replace(definition,marker,marker||' IF z=''ravine'' THEN RAISE EXCEPTION ''Reach the third scroll in the Crystal Maze''; END IF;');
  EXECUTE definition;
 END LOOP;
END $$;