DO $patch$
DECLARE fname text; def text;
BEGIN
  FOREACH fname IN ARRAY ARRAY['treasure_v5_action','treasure_v6_action'] LOOP
    def := pg_get_functiondef((SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = fname));
    IF position('"seed-1":["meadow",4,14],"seed-2":["meadow",18,8],"seed-3":["meadow",12,26]' IN def) = 0 THEN
      RAISE EXCEPTION 'Unexpected seed locations in %; refusing to overwrite game rules', fname;
    END IF;
    def := replace(def,
      '"seed-1":["meadow",4,14],"seed-2":["meadow",18,8],"seed-3":["meadow",12,26]',
      '"seed-1":["meadow",2,2],"seed-2":["meadow",20,20],"seed-3":["meadow",12,29]');
    EXECUTE def;
  END LOOP;
END $patch$;