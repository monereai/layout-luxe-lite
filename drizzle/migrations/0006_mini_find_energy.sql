ALTER TABLE public.care_game_rounds ADD COLUMN rewarded_finds integer[] NOT NULL DEFAULT '{}';
CREATE FUNCTION public.care_reward_find(p_round uuid, p_spot integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.care_game_rounds; state jsonb; gained integer := 0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 IF p_spot IS NULL OR p_spot NOT BETWEEN 0 AND 9 THEN RAISE EXCEPTION 'Invalid Mini-Monere'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR r.kind <> 'find' THEN RAISE EXCEPTION 'Find round not found'; END IF;
 state := public.care_apply('sync');
 IF NOT r.completed AND NOT (p_spot = ANY(r.rewarded_finds)) THEN
  gained := least(1,100-(state->>'energy')::integer);
  UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
  UPDATE public.care_game_rounds SET rewarded_finds=array_append(rewarded_finds,p_spot) WHERE id=r.id;
 END IF;
 RETURN state || jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained);
END; $$;
REVOKE ALL ON FUNCTION public.care_reward_find(uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.care_reward_find(uuid,integer) TO authenticated;