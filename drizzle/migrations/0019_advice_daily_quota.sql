CREATE TABLE public.advice_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.advice_usage TO authenticated;
GRANT ALL ON public.advice_usage TO service_role;
ALTER TABLE public.advice_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own advice usage" ON public.advice_usage FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.consume_advice_quota()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_count integer;
BEGIN
  IF v_uid IS NULL THEN RETURN false; END IF;
  IF public.is_premium('live') OR public.is_premium('sandbox') THEN RETURN true; END IF;
  INSERT INTO public.advice_usage(user_id, day, count) VALUES (v_uid, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET count = public.advice_usage.count + 1
    WHERE public.advice_usage.count < 3
  RETURNING count INTO v_count;
  RETURN v_count IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.consume_advice_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_advice_quota() TO authenticated;