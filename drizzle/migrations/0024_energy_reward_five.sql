CREATE OR REPLACE FUNCTION public.care_reward_piece(p_round uuid, p_spot integer, p_proof jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; gained integer:=0;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game round not found'; END IF;
 IF p_spot IS NULL OR p_spot<0 OR p_spot>=(CASE WHEN r.kind='find' THEN 10 ELSE r.size*r.size END) THEN RAISE EXCEPTION 'Invalid spot'; END IF;
 IF r.kind='jigsaw' THEN a:=public.care_valid_order(r.initial_order,r.size,p_proof); IF a[p_spot+1]<>p_spot THEN RAISE EXCEPTION 'Place the piece correctly first'; END IF; END IF;
 state:=public.care_apply('sync');
 IF NOT r.completed AND NOT(p_spot=ANY(r.rewarded_finds)) THEN
  gained:=greatest(0,least(5,100-(state->>'energy')::integer));
  UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
  UPDATE public.care_game_rounds SET rewarded_finds=array_append(rewarded_finds,p_spot) WHERE id=r.id;
 END IF;
 RETURN state||jsonb_build_object('energy',(state->>'energy')::integer+gained,'energyAwarded',gained,'pointsAwarded',0,'fullBonus',0);
END; $function$;

CREATE OR REPLACE FUNCTION public.care_finish_round(p_round uuid, p_proof jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.care_game_rounds; state jsonb; a integer[]; gained integer; final_energy integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 SELECT * INTO r FROM public.care_game_rounds WHERE id=p_round AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Game round not found'; END IF;
 IF r.completed THEN RETURN public.care_apply('sync'); END IF;
 IF jsonb_typeof(p_proof) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid round result'; END IF;
 IF r.kind='find' THEN
  IF jsonb_array_length(p_proof)<>10 OR (SELECT count(DISTINCT value::integer) FROM jsonb_array_elements_text(p_proof))<>10 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_proof) WHERE value::integer NOT BETWEEN 0 AND 9) THEN RAISE EXCEPTION 'Find all 10 Mini-Moneres first'; END IF;
 ELSE
  a:=public.care_valid_order(r.initial_order,r.size,p_proof);
  IF a<>ARRAY(SELECT generate_series(0,r.size*r.size-1)) THEN RAISE EXCEPTION 'Finish the puzzle first'; END IF;
 END IF;
 state:=public.care_apply('sync'); gained:=greatest(0,least(5,100-(state->>'energy')::integer));
 UPDATE public.profiles SET monere_energy=monere_energy+gained WHERE user_id=auth.uid();
 INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(auth.uid(),'game_round','round:'||r.id,5) ON CONFLICT(reference) DO NOTHING;
 UPDATE public.care_game_rounds SET completed=true WHERE id=r.id;
 SELECT monere_energy INTO final_energy FROM public.profiles WHERE user_id=auth.uid();
 RETURN state||jsonb_build_object('energy',final_energy,'energyAwarded',gained,'pointsAwarded',5,'fullBonus',0);
END; $function$;