DO $migration$
DECLARE definition text; old_spots text := '"seed-1":["wood",7,8],"seed-2":["ravine",16,8],"seed-3":["lair",18,18]';
BEGIN
 SELECT pg_get_functiondef('public.treasure_v6_action(text,integer,integer,text)'::regprocedure) INTO definition;
 IF position(old_spots IN definition)=0 THEN RAISE EXCEPTION 'Unexpected seed locations; refusing to overwrite game rules'; END IF;
 definition := replace(definition,old_spots,'"seed-1":["wood",11,11],"seed-2":["ravine",12,8],"seed-3":["lair",12,18]');
 EXECUTE definition;
END $migration$;
NOTIFY pgrst, 'reload schema';