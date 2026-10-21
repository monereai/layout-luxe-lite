CREATE TABLE public.guest_ai_usage (visitor text NOT NULL, day date NOT NULL, count integer NOT NULL DEFAULT 0, PRIMARY KEY (visitor, day));
GRANT ALL ON public.guest_ai_usage TO service_role;
ALTER TABLE public.guest_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.consume_guest_quota(p_visitor text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  INSERT INTO public.guest_ai_usage(visitor, day, count) VALUES (p_visitor, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (visitor, day) DO UPDATE SET count = guest_ai_usage.count + 1
  RETURNING count INTO n;
  RETURN n <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_guest_quota(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_guest_quota(text, integer) TO service_role;