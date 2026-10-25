DO $patch$
DECLARE fname text; def text;
BEGIN
  FOREACH fname IN ARRAY ARRAY['treasure_v5_action','treasure_v6_action'] LOOP
    def := pg_get_functiondef((SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = fname));
    def := replace(def,
      '"seed-1":["wood",11,11],"seed-2":["ravine",12,8],"seed-3":["lair",12,18],"apple-1":["meadow",12,8],"apple-2":["wood",13,11],"apple-3":["ravine",11,7]',
      '"seed-1":["meadow",4,14],"seed-2":["meadow",18,8],"seed-3":["meadow",12,26],"apple-1":["wood",13,11],"apple-2":["wood",5,8],"apple-3":["wood",19,16]');
    EXECUTE def;
  END LOOP;
END $patch$;