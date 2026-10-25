DO $mig$
DECLARE def text := pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure);
BEGIN
  -- Guards: confirm the expected current snapshot before editing it.
  IF position('"seed-1":["wood",7,8],"seed-2":["ravine",16,8],"seed-3":["lair",18,18]}' in def) = 0
    OR position('"item":"griffin-crown","pts":50}}' in def) = 0
    OR position('monere_energy+10,100' in def) = 0
    THEN RAISE EXCEPTION 'Expected treasure_v5_action snapshot not found'; END IF;
  -- Restore the aligned seed pickup coordinates and add Connie's three dropped apples.
  def := replace(def,
    '"seed-1":["wood",7,8],"seed-2":["ravine",16,8],"seed-3":["lair",18,18]}',
    '"seed-1":["wood",11,11],"seed-2":["ravine",12,8],"seed-3":["lair",12,18],"apple-1":["wood",4,19],"apple-2":["wood",19,20],"apple-3":["wood",10,19]}');
  -- Add Connie the fruit picker at the bottom of Lonely Wood.
  def := replace(def,
    '"item":"griffin-crown","pts":50}}',
    '"item":"griffin-crown","pts":50},"connie":{"z":"wood","x":6,"y":20,"need":["apple-1","apple-2","apple-3"],"pts":30}}');
  EXECUTE def;
END $mig$;
NOTIFY pgrst, 'reload schema';
