DO $$
DECLARE
  fn record;
  definition text;
  updated text;
  patched integer := 0;
BEGIN
  FOR fn IN SELECT p.oid, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname IN ('treasure_v5_action', 'treasure_v6_action')
  LOOP
    definition := pg_get_functiondef(fn.oid);
    updated := replace(replace(replace(definition,
      '"seed-1":["meadow",2,2]', '"seed-1":["meadow",9,10]'),
      '"seed-2":["meadow",20,20]', '"seed-2":["meadow",11,14]'),
      '"seed-3":["meadow",12,29]', '"seed-3":["meadow",10,17]');
    IF position('"seed-1":["meadow",9,10]' in updated) = 0
      OR position('"seed-2":["meadow",11,14]' in updated) = 0
      OR position('"seed-3":["meadow",10,17]' in updated) = 0 THEN
      RAISE EXCEPTION 'Seed coordinate patch failed for %', fn.proname;
    END IF;
    EXECUTE updated;
    patched := patched + 1;
  END LOOP;
  IF patched <> 2 THEN RAISE EXCEPTION 'Expected two adventure action functions, patched %', patched; END IF;
END $$;