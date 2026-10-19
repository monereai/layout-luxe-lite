ALTER TABLE public.profiles ADD COLUMN last_biblical_snap date;
CREATE TABLE public.biblical_snap_rounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
 player_score integer NOT NULL DEFAULT 0 CHECK(player_score BETWEEN 0 AND 3), monere_score integer NOT NULL DEFAULT 0 CHECK(monere_score BETWEEN 0 AND 3),
 left_card integer NOT NULL DEFAULT 0 CHECK(left_card BETWEEN 0 AND 11), right_card integer NOT NULL DEFAULT 1 CHECK(right_card BETWEEN 0 AND 11),
 turn integer NOT NULL DEFAULT 0, snapped boolean NOT NULL DEFAULT false, completed boolean NOT NULL DEFAULT false,
 shown_at timestamptz NOT NULL DEFAULT clock_timestamp(), created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.biblical_snap_rounds TO authenticated;
GRANT ALL ON public.biblical_snap_rounds TO service_role;
ALTER TABLE public.biblical_snap_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own snap rounds" ON public.biblical_snap_rounds FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX biblical_snap_owner_idx ON public.biblical_snap_rounds(user_id,created_at);
CREATE FUNCTION public.biblical_snap_action(p_action text, p_round uuid DEFAULT NULL, p_turn integer DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); r public.biblical_snap_rounds; state jsonb:=NULL; today date:=(now() AT TIME ZONE 'UTC')::date; last_claim date; paid boolean:=false; gained integer:=0; credited integer:=0;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in to play Biblical Snap'; END IF;
 IF p_action NOT IN ('start','next','snap') OR p_action IS NULL THEN RAISE EXCEPTION 'Invalid game action'; END IF;
 IF p_action='start' THEN
  PERFORM public.care_apply('sync');
  IF (SELECT count(*) FROM public.biblical_snap_rounds WHERE user_id=u AND created_at>now()-interval '1 minute')>=10 THEN RAISE EXCEPTION 'Please wait before starting another round'; END IF;
  INSERT INTO public.biblical_snap_rounds(user_id,left_card,right_card) VALUES(u,floor(random()*12)::integer,floor(random()*12)::integer) RETURNING * INTO r;
 ELSE
  SELECT * INTO r FROM public.biblical_snap_rounds WHERE id=p_round AND user_id=u FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Round not found'; END IF;
  IF r.created_at<now()-interval '30 minutes' THEN RAISE EXCEPTION 'Round expired. Start again'; END IF;
  IF NOT r.completed AND p_turn=r.turn THEN
   IF p_action='snap' THEN
    IF clock_timestamp()-r.shown_at<interval '2 seconds' AND NOT r.snapped AND r.left_card/2=r.right_card/2 THEN
     r.player_score:=r.player_score+1; r.snapped:=true;
    END IF;
   ELSE
    IF clock_timestamp()-r.shown_at<interval '1.5 seconds' THEN RAISE EXCEPTION 'Cards are still turning'; END IF;
    IF NOT r.snapped AND r.left_card/2=r.right_card/2 THEN r.monere_score:=r.monere_score+1; END IF;
    IF r.monere_score<3 THEN
     r.left_card:=floor(random()*12)::integer;
     r.right_card:=CASE WHEN random()<0.55 THEN (r.left_card/2)*2+floor(random()*2)::integer ELSE floor(random()*12)::integer END;
     r.turn:=r.turn+1; r.snapped:=false; r.shown_at:=clock_timestamp();
    END IF;
   END IF;
   r.completed:=r.player_score=3 OR r.monere_score=3;
   UPDATE public.biblical_snap_rounds SET player_score=r.player_score,monere_score=r.monere_score,left_card=r.left_card,right_card=r.right_card,turn=r.turn,snapped=r.snapped,shown_at=r.shown_at,completed=r.completed WHERE id=r.id;
   IF r.completed AND r.player_score=3 THEN
    state:=public.care_apply('sync');
    SELECT last_biblical_snap INTO last_claim FROM public.profiles WHERE user_id=u FOR UPDATE;
    IF last_claim IS DISTINCT FROM today THEN
     INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','biblical_snap:'||u||':'||today,50) ON CONFLICT(reference) DO NOTHING;
     IF FOUND THEN
      paid:=true; credited:=50; gained:=greatest(0,least(25,100-(state->>'energy')::integer));
      UPDATE public.profiles SET monere_energy=monere_energy+gained,last_biblical_snap=today WHERE user_id=u;
     END IF;
    END IF;
    state:=state||jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',credited);
   END IF;
  END IF;
 END IF;
 SELECT last_biblical_snap INTO last_claim FROM public.profiles WHERE user_id=u;
 RETURN jsonb_build_object('id',r.id,'turn',r.turn,'left',r.left_card,'right',r.right_card,'playerScore',r.player_score,'monereScore',r.monere_score,'snapped',r.snapped,'completed',r.completed,'rewardAvailable',last_claim IS DISTINCT FROM today,'rewarded',paid,'care',state);
END; $$;
REVOKE ALL ON FUNCTION public.biblical_snap_action(text,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.biblical_snap_action(text,uuid,integer) TO authenticated;