DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure) INTO definition;
 IF position('"seed-1":["meadow",3,15],"seed-2":["meadow",18,4],"seed-3":["meadow",13,14]' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected seed locations; refusing to overwrite game rules'; END IF;
 definition:=replace(definition,'"seed-1":["meadow",3,15],"seed-2":["meadow",18,4],"seed-3":["meadow",13,14]','"seed-1":["wood",7,8],"seed-2":["ravine",16,8],"seed-3":["lair",18,18]');
 definition:=replace(definition,'  IF p_id LIKE ''seed-%'' AND NOT(s->''met'' ? ''vernon'') THEN RAISE EXCEPTION ''Talk to Vernon the Gardener first''; END IF;','');
 IF position('Talk to Vernon the Gardener first' IN definition)>0 THEN RAISE EXCEPTION 'Seed visibility gate was not removed'; END IF;
 EXECUTE definition;
END $migration$;
NOTIFY pgrst, 'reload schema';