ALTER TABLE public.care_game_rounds DROP CONSTRAINT care_game_rounds_size_check;
ALTER TABLE public.care_game_rounds ADD CONSTRAINT care_game_rounds_size_check CHECK (size IN (3,4,5,6,7));
CREATE OR REPLACE FUNCTION public.care_start_round(p_kind text, p_size integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r public.care_game_rounds; a integer[];
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in for game rewards'; END IF;
 IF p_kind NOT IN ('find','jigsaw') OR p_size NOT IN (3,4,5,6,7) OR (p_kind='find' AND p_size=7) THEN RAISE EXCEPTION 'Invalid game'; END IF;
 IF p_kind='jigsaw' THEN
  SELECT array_agg(i ORDER BY random()) INTO a FROM generate_series(0,p_size*p_size-1) i;
  IF a=ARRAY(SELECT generate_series(0,p_size*p_size-1)) THEN a[1]:=1; a[2]:=0; END IF;
 ELSE a:='{}'; END IF;
 INSERT INTO public.care_game_rounds(user_id,kind,size,initial_order) VALUES(auth.uid(),p_kind,p_size,a) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'order',r.initial_order);
END; $function$