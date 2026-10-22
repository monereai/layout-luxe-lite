CREATE FUNCTION public.treasure_v3_walkable(z text,x int,y int) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT x IS NOT NULL AND y IS NOT NULL AND x BETWEEN 2 AND 21 AND y BETWEEN 2 AND 21 AND CASE z
  WHEN 'meadow' THEN y<21 OR x BETWEEN 11 AND 13
  WHEN 'wood' THEN NOT((x BETWEEN 4 AND 8 AND y BETWEEN 12 AND 15) OR (x BETWEEN 14 AND 17 AND y BETWEEN 12 AND 15))
  WHEN 'ravine' THEN NOT(y BETWEEN 10 AND 13 AND (x<10 OR x>13))
  WHEN 'lair' THEN NOT(y IN (9,10) AND x<>12) AND (y<21 OR x=12)
  ELSE false END $$;
REVOKE ALL ON FUNCTION public.treasure_v3_walkable(text,int,int) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.treasure_v3_action(p_action text,p_x int DEFAULT NULL,p_y int DEFAULT NULL,p_id text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; z text; x int; y int; duel int; tile int; p jsonb; granted boolean:=false;
 scrolls jsonb:='{"meadow":[7,6],"wood":[12,6],"ravine":[6,17],"lair":[5,15]}';
 answers jsonb:='{"meadow":0,"wood":1,"ravine":1,"lair":2}';
 portals jsonb:='{"meadow":[{"x":21,"y":10,"t":"wood","ax":3,"ay":10,"f":true}],"wood":[{"x":2,"y":10,"t":"meadow","ax":20,"ay":10,"f":false},{"x":21,"y":10,"t":"ravine","ax":3,"ay":6,"f":true}],"ravine":[{"x":2,"y":6,"t":"wood","ax":20,"ay":10,"f":false},{"x":21,"y":17,"t":"lair","ax":12,"ay":19,"f":true}],"lair":[{"x":12,"y":21,"t":"ravine","ax":20,"ay":17,"f":false}]}';
 duel_answers int[]:=ARRAY[1,2,0];
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.treasure_saves(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT ts.state INTO s FROM public.treasure_saves ts WHERE ts.user_id=u FOR UPDATE;
 IF coalesce(s->>'version','')<>'3' THEN s:='{"version":3,"zone":"meadow","x":10,"y":12,"scrolls":[],"gates":[],"duel":0,"rescued":false}'; END IF;
 z:=s->>'zone'; x:=(s->>'x')::int; y:=(s->>'y')::int; duel:=coalesce((s->>'duel')::int,0);
 IF p_action='move' THEN
  IF p_x IS NULL OR p_y IS NULL OR abs(x-p_x)+abs(y-p_y)<>1 OR NOT public.treasure_v3_walkable(z,p_x,p_y) OR (z='lair' AND p_y IN (9,10) AND NOT(s->'gates' ? 'lair')) THEN RAISE EXCEPTION 'Blocked path'; END IF;
  s:=s || jsonb_build_object('x',p_x,'y',p_y);
 ELSIF p_action='collect' THEN
  IF abs(x-(scrolls->z->>0)::int)+abs(y-(scrolls->z->>1)::int)>1 THEN RAISE EXCEPTION 'Scroll out of reach'; END IF;
  IF NOT(s->'scrolls' ? z) THEN s:=jsonb_set(s,'{scrolls}',s->'scrolls' || to_jsonb(z)); END IF;
 ELSIF p_action='answer' THEN
  IF p_id IS DISTINCT FROM z OR NOT(s->'scrolls' ? z) OR s->'gates' ? z THEN RAISE EXCEPTION 'No riddle here'; END IF;
  IF z='lair' THEN IF abs(x-12)+abs(y-10)>1 THEN RAISE EXCEPTION 'Reach the door first'; END IF;
  ELSIF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(portals->z) q WHERE (q->>'f')::boolean AND abs(x-(q->>'x')::int)+abs(y-(q->>'y')::int)<=1) THEN RAISE EXCEPTION 'Reach the gate first'; END IF;
  IF p_x IS DISTINCT FROM (answers->>z)::int THEN RAISE EXCEPTION 'Not quite — think again!'; END IF;
  s:=jsonb_set(s,'{gates}',s->'gates' || to_jsonb(z));
 ELSIF p_action='portal' THEN
  SELECT q INTO p FROM jsonb_array_elements(portals->z) q WHERE q->>'t'=p_id AND abs(x-(q->>'x')::int)+abs(y-(q->>'y')::int)<=1;
  IF p IS NULL THEN RAISE EXCEPTION 'Reach the portal first'; END IF;
  IF (p->>'f')::boolean AND NOT(s->'gates' ? z) THEN RAISE EXCEPTION 'Answer the gatekeeper riddle first'; END IF;
  s:=s || jsonb_build_object('zone',p_id,'x',(p->>'ax')::int,'y',(p->>'ay')::int);
 ELSIF p_action='duel' THEN
  IF z<>'lair' OR NOT(s->'gates' ? 'lair') OR coalesce((s->>'rescued')::boolean,false) OR y<>6 OR x NOT IN (10,12,14) OR p_x IS DISTINCT FROM (x-10)/2 THEN RAISE EXCEPTION 'Stand on a duel tile'; END IF;
  tile:=(x-10)/2;
  IF tile<>duel_answers[duel+1] THEN s:=s || '{"x":12,"y":8}'::jsonb;
  ELSE duel:=duel+1; s:=s || jsonb_build_object('duel',duel,'rescued',duel=3);
   IF duel=3 THEN
    INSERT INTO public.user_pets(user_id) VALUES(u) ON CONFLICT DO NOTHING;
    UPDATE public.user_pets SET owned_pets=array_append(owned_pets,'golden-griffin'),updated_at=now() WHERE user_id=u AND NOT('golden-griffin'=ANY(owned_pets));
    granted:=FOUND;
   END IF;
  END IF;
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'Unknown action'; END IF;
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 RETURN jsonb_build_object('state',s,'griffin',granted);
END $$;
REVOKE ALL ON FUNCTION public.treasure_v3_action(text,int,int,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v3_action(text,int,int,text) TO authenticated;

CREATE FUNCTION public.treasure_v3_travel(p_steps jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE step jsonb; result jsonb; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF; IF jsonb_typeof(p_steps) IS DISTINCT FROM 'array' OR jsonb_array_length(p_steps)>32 THEN RAISE EXCEPTION 'Invalid path'; END IF; FOR step IN SELECT value FROM jsonb_array_elements(p_steps) LOOP IF jsonb_typeof(step->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(step->'y') IS DISTINCT FROM 'number' OR (step->>'x')::numeric<>trunc((step->>'x')::numeric) OR (step->>'y')::numeric<>trunc((step->>'y')::numeric) THEN RAISE EXCEPTION 'Invalid step'; END IF; result:=public.treasure_v3_action('move',(step->>'x')::int,(step->>'y')::int); END LOOP; RETURN coalesce(result,public.treasure_v3_action('status')); END $$;
REVOKE ALL ON FUNCTION public.treasure_v3_travel(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.treasure_v3_travel(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.pet_action(p_action text, p_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE u uuid := auth.uid(); cost int; bal int; row_ user_pets%ROWTYPE; eq text; free_ boolean := public.is_sandbox_admin();
BEGIN
  IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  INSERT INTO user_pets(user_id) VALUES (u) ON CONFLICT DO NOTHING;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u FOR UPDATE;
  IF p_action = 'unequip' THEN
    UPDATE profiles SET equipped_pet_id = NULL WHERE user_id = u;
  ELSE
    cost := CASE p_id WHEN 'puppy' THEN 300 WHEN 'kitten' THEN 300 WHEN 'goldfish' THEN 300 WHEN 'hedgehog' THEN 300 WHEN 'turtle' THEN 300 WHEN 'bunny' THEN 800 WHEN 'parrot' THEN 800 WHEN 'fox' THEN 800 WHEN 'owl' THEN 800 WHEN 'baby-dragon' THEN 2000 WHEN 'unicorn' THEN 2000 WHEN 'thunderbird' THEN 3000 WHEN 'phoenix' THEN 3000 WHEN 'golden-griffin' THEN -1 ELSE NULL END;
    IF cost IS NULL THEN RAISE EXCEPTION 'Unknown pet'; END IF;
    IF p_action = 'buy' THEN
      IF cost < 0 THEN RAISE EXCEPTION 'This pet is earned by rescuing it in the adventure'; END IF;
      IF NOT (p_id = ANY(row_.owned_pets)) THEN
        IF NOT free_ THEN
          SELECT monere_points INTO bal FROM profiles WHERE user_id = u FOR UPDATE;
          IF coalesce(bal, 0) < cost THEN RAISE EXCEPTION 'Not enough points'; END IF;
          UPDATE profiles SET monere_points = monere_points - cost WHERE user_id = u;
        END IF;
        UPDATE user_pets SET owned_pets = array_append(owned_pets, p_id), updated_at = now() WHERE user_id = u;
      END IF;
    ELSIF p_action = 'equip' THEN
      IF NOT (p_id = ANY(row_.owned_pets)) THEN RAISE EXCEPTION 'Pet not owned'; END IF;
    ELSE RAISE EXCEPTION 'Unknown action'; END IF;
    UPDATE profiles SET equipped_pet_id = p_id WHERE user_id = u;
  END IF;
  SELECT * INTO row_ FROM user_pets WHERE user_id = u;
  SELECT equipped_pet_id INTO eq FROM profiles WHERE user_id = u;
  RETURN jsonb_build_object('owned', row_.owned_pets, 'active', eq);
END; $function$;