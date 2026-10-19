CREATE OR REPLACE FUNCTION public.daily_dilemma_action(p_action text DEFAULT 'status', p_day date DEFAULT NULL, p_choice integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE u uuid:=auth.uid(); today date:=(now() AT TIME ZONE 'UTC')::date; scenario integer:=((today-date '2026-01-01')%4+4)%4; last_claim date; state jsonb; paid boolean:=false; gained integer:=0; accepted boolean:=false; correct integer; can_reset boolean;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to play Monere Daily Dilemma'; END IF;
 can_reset:=public.is_sandbox_admin() OR public.has_role(u,'admin') OR public.has_role(u,'tester');
 IF p_action IS NULL OR p_action NOT IN ('status','choose','reset') THEN RAISE EXCEPTION 'Invalid dilemma action'; END IF;
 IF p_action='reset' AND NOT can_reset THEN RAISE EXCEPTION 'Admin or tester access required'; END IF;
 state:=public.care_apply('sync');
 SELECT last_daily_dilemma INTO last_claim FROM public.profiles WHERE user_id=u FOR UPDATE;
 IF p_action='reset' THEN
  UPDATE public.profiles SET last_daily_dilemma=NULL WHERE user_id=u;
  last_claim:=NULL;
 END IF;
 correct:=CASE scenario WHEN 0 THEN 1 WHEN 1 THEN 0 WHEN 2 THEN 2 ELSE 1 END;
 IF p_action='choose' THEN
  IF p_day IS DISTINCT FROM today THEN RAISE EXCEPTION 'A new daily dilemma is ready. Please reopen it.'; END IF;
  IF p_choice IS NULL OR p_choice NOT BETWEEN 0 AND 2 THEN RAISE EXCEPTION 'Choose one of the three responses'; END IF;
  accepted:=p_choice=correct;
  IF accepted AND last_claim IS DISTINCT FROM today THEN
   INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','daily_dilemma:'||u||':'||today,50) ON CONFLICT(reference) DO NOTHING;
   IF FOUND THEN
    paid:=true; gained:=greatest(0,least(25,100-(state->>'energy')::integer));
    UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=u;
   END IF;
   -- Resetting permits replay, not additional daily payouts; still finish practice.
   UPDATE public.profiles SET last_daily_dilemma=today WHERE user_id=u;
   last_claim:=today;
  END IF;
 END IF;
 state:=state||jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',CASE WHEN paid THEN 50 ELSE 0 END);
 RETURN jsonb_build_object('day',today,'scenario',scenario,'completed',coalesce(last_claim=today,false),'canReset',can_reset,'accepted',accepted,'rewarded',paid,'serverNow',extract(epoch from clock_timestamp())*1000,'nextAt',extract(epoch from ((today+1)::timestamp AT TIME ZONE 'UTC'))*1000,'care',state);
END;
$function$;
REVOKE ALL ON FUNCTION public.daily_dilemma_action(text,date,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daily_dilemma_action(text,date,integer) TO authenticated, service_role;