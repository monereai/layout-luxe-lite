DO $mig$
DECLARE
  def text := pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure);
  old_apples text := '"apple-1":["wood",4,19],"apple-2":["wood",19,20],"apple-3":["wood",10,19]';
  new_apples text := '"apple-1":["meadow",12,8],"apple-2":["wood",13,11],"apple-3":["ravine",11,7]';
BEGIN
  IF position(old_apples in def) = 0 THEN
    RAISE EXCEPTION 'Expected Connie apple positions not found';
  END IF;
  -- Only change pickup coordinates; retain item IDs, collected saves and rewards.
  EXECUTE replace(def, old_apples, new_apples);
END $mig$;
NOTIFY pgrst, 'reload schema';