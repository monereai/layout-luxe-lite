ALTER TABLE public.profiles ADD COLUMN last_daily_dilemma date;
UPDATE public.profiles SET last_daily_dilemma=last_biblical_snap WHERE last_biblical_snap IS NOT NULL;
COMMENT ON COLUMN public.profiles.last_biblical_snap IS 'DEPRECATED: replaced by last_daily_dilemma';
COMMENT ON TABLE public.biblical_snap_rounds IS 'DEPRECATED: replaced by Monere Daily Dilemma';
COMMENT ON FUNCTION public.biblical_snap_action(text,uuid,integer) IS 'DEPRECATED: replaced by daily_dilemma_action';
CREATE FUNCTION public.daily_dilemma_action(p_action text DEFAULT 'status', p_day date DEFAULT NULL, p_choice integer DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); today date:=(now() AT TIME ZONE 'UTC')::date; scenario integer:=((today-date '2026-01-01')%4+4)%4; last_claim date; state jsonb; paid boolean:=false; gained integer:=0; accepted boolean:=false; correct integer;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to play Monere Daily Dilemma'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('status','choose') THEN RAISE EXCEPTION 'Invalid dilemma action'; END IF;
 state:=public.care_apply('sync');
 SELECT last_daily_dilemma INTO last_claim FROM public.profiles WHERE user_id=u FOR UPDATE;
 correct:=CASE scenario WHEN 0 THEN 1 WHEN 1 THEN 0 WHEN 2 THEN 2 ELSE 1 END;
 IF p_action='choose' THEN
  IF p_day IS DISTINCT FROM today THEN RAISE EXCEPTION 'A new daily dilemma is ready. Please reopen it.'; END IF;
  IF p_choice IS NULL OR p_choice NOT BETWEEN 0 AND 2 THEN RAISE EXCEPTION 'Choose one of the three responses'; END IF;
  accepted:=p_choice=correct;
  IF accepted AND last_claim IS DISTINCT FROM today THEN
   INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','daily_dilemma:'||u||':'||today,50) ON CONFLICT(reference) DO NOTHING;
   IF FOUND THEN
    paid:=true; gained:=greatest(0,least(25,100-(state->>'energy')::integer));
    UPDATE public.profiles SET monere_energy=monere_energy+gained,last_daily_dilemma=today WHERE user_id=u;
    last_claim:=today;
   END IF;
  END IF;
 END IF;
 state:=state||jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',CASE WHEN paid THEN 50 ELSE 0 END);
 RETURN jsonb_build_object('day',today,'scenario',scenario,'completed',last_claim=today,'accepted',accepted,'rewarded',paid,'serverNow',extract(epoch from clock_timestamp())*1000,'nextAt',extract(epoch from ((today+1)::timestamp AT TIME ZONE 'UTC'))*1000,'care',state);
END; $$;
REVOKE ALL ON FUNCTION public.daily_dilemma_action(text,date,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.daily_dilemma_action(text,date,integer) TO authenticated;