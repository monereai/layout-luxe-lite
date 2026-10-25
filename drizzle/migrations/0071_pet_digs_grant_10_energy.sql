DO $mig$
DECLARE def text := pg_get_functiondef('public.treasure_v5_action(text,integer,integer,text)'::regprocedure);
BEGIN
  IF position('monere_energy+25,100' in def) = 0 THEN RAISE EXCEPTION 'Expected 25 Energy dig rule not found'; END IF;
  def := replace(replace(def, 'monere_energy+25,100', 'monere_energy+10,100'), 'rewards 25 Energy', 'rewards 10 Energy');
  EXECUTE def;
END $mig$;
NOTIFY pgrst, 'reload schema';