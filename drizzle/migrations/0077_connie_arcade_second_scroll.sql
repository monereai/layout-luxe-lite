CREATE TABLE public.connie_arcade_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz,
  ticks integer NOT NULL DEFAULT 0,
  catches integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connie_arcade_rounds TO authenticated;
GRANT ALL ON public.connie_arcade_rounds TO service_role;
ALTER TABLE public.connie_arcade_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players read their own arcade rounds" ON public.connie_arcade_rounds FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.connie_arcade_start()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE u uuid:=auth.uid(); s jsonb; r uuid;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=u FOR UPDATE;
 IF s IS NULL OR NOT(s->'quests' ? 'connie') THEN RAISE EXCEPTION 'Deliver Connie’s apples first'; END IF;
 IF (SELECT count(*) FROM public.connie_arcade_rounds WHERE user_id=u AND started_at>now()-interval '1 minute')>=6 THEN RAISE EXCEPTION 'Please wait before playing again'; END IF;
 PERFORM public.care_apply('sync');
 INSERT INTO public.connie_arcade_rounds(user_id) VALUES(u) RETURNING id INTO r;
 RETURN jsonb_build_object('id',r);
END $function$;
GRANT EXECUTE ON FUNCTION public.connie_arcade_start() TO authenticated;

CREATE OR REPLACE FUNCTION public.connie_arcade_commit(p_user uuid, p_round uuid, p_ticks integer, p_catches integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE r public.connie_arcade_rounds; s jsonb; e integer;
BEGIN
 SELECT * INTO r FROM public.connie_arcade_rounds WHERE id=p_round AND user_id=p_user FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Arcade round not found'; END IF;
 SELECT state INTO s FROM public.treasure_saves WHERE user_id=p_user FOR UPDATE;
 SELECT monere_energy INTO e FROM public.profiles WHERE user_id=p_user FOR UPDATE;
 IF e IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
 IF r.settled_at IS NOT NULL THEN RETURN jsonb_build_object('energy',e,'state',s); END IF;
 IF NOT(s->'quests' ? 'connie') THEN RAISE EXCEPTION 'The orchard changed during this round'; END IF;
 IF p_ticks>24000 OR now()>r.started_at+interval '25 minutes' OR clock_timestamp()<r.started_at+p_ticks*interval '0.05 seconds'-interval '1 second' THEN RAISE EXCEPTION 'Invalid arcade timing'; END IF;
 -- Connie's arcade prize is the second (wood) scroll; granting is idempotent so replays never duplicate it.
 IF NOT(COALESCE(s->'scrolls','[]'::jsonb) ? 'wood') THEN s:=jsonb_set(s,'{scrolls}',COALESCE(s->'scrolls','[]'::jsonb)||'"wood"'::jsonb); END IF;
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=p_user;
 UPDATE public.connie_arcade_rounds SET settled_at=now(),ticks=p_ticks,catches=p_catches WHERE id=r.id;
 RETURN jsonb_build_object('energy',e,'state',s);
END $function$;
GRANT EXECUTE ON FUNCTION public.connie_arcade_commit(uuid,uuid,integer,integer) TO service_role;