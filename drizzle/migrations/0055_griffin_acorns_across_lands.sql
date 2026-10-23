CREATE OR REPLACE FUNCTION public.treasure_v5_action(p_action text,p_x int DEFAULT NULL,p_y int DEFAULT NULL,p_id text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE u uuid:=auth.uid(); s jsonb; z text; x int; y int; duel int; tile int; p jsonb; granted boolean:=false; pts int:=0; q jsonb; need text; pool int[]:=ARRAY[0,1,1,2,1,2,0,1,1,0,1,1,2,0,1,0]; slot int; rs jsonb;
 scrolls jsonb:='{"meadow":[7,6],"wood":[12,6],"ravine":[6,17],"lair":[5,15]}';
 portals jsonb:='{"meadow":[{"x":21,"y":10,"t":"wood","ax":3,"ay":10,"f":true}],"wood":[{"x":2,"y":10,"t":"meadow","ax":20,"ay":10,"f":false},{"x":21,"y":10,"t":"ravine","ax":3,"ay":6,"f":true}],"ravine":[{"x":2,"y":6,"t":"wood","ax":20,"ay":10,"f":false},{"x":21,"y":17,"t":"lair","ax":12,"ay":19,"f":true}],"lair":[{"x":12,"y":21,"t":"ravine","ax":20,"ay":17,"f":false}]}';
 items jsonb:='{"feather-1":["meadow",4,4],"feather-2":["wood",4,7],"feather-3":["wood",15,9],"acorn-1":["meadow",8,15],"acorn-2":["wood",20,3],"acorn-3":["ravine",5,8],"bell":["ravine",19,3]}';
 npcs jsonb:='{"barnaby":{"z":"meadow","x":14,"y":8,"need":["feather-1","feather-2","feather-3"],"gear":"lantern","pts":30},"pippa":{"z":"wood","x":9,"y":9,"need":["acorn-1","acorn-2","acorn-3"],"gear":"boots","pts":30},"rocco":{"z":"ravine","x":12,"y":4,"need":["bell"],"gear":"goggles","pts":30},"tilly":{"z":"lair","x":17,"y":19,"need":["fragment-1","fragment-2","fragment-3"],"item":"griffin-crown","pts":50}}';
 digs jsonb:='{"m-coins":["meadow",5,17,"",10],"m-frag":["meadow",19,15,"fragment-1",0],"w-coins":["wood",10,4,"",10],"w-relic":["wood",12,20,"relic-acorn-charm",0],"r-coins":["ravine",8,4,"",10],"r-frag":["ravine",19,19,"fragment-2",0],"l-frag":["lair",16,16,"fragment-3",0],"l-coins":["lair",19,13,"",15]}';
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 INSERT INTO public.treasure_saves(user_id) VALUES(u) ON CONFLICT DO NOTHING;
 SELECT ts.state INTO s FROM public.treasure_saves ts WHERE ts.user_id=u FOR UPDATE;
 IF coalesce(s->>'version','')<>'3' THEN s:='{"version":3,"zone":"meadow","x":10,"y":12,"scrolls":[],"gates":[],"duel":0,"rescued":false}'; END IF;
 s:='{"gear":[],"items":[],"quests":[],"met":[],"dug":[],"lily":0,"pet":null,"fog":{}}'::jsonb || s;
 IF jsonb_typeof(s->'riddles') IS DISTINCT FROM 'array' OR jsonb_array_length(s->'riddles')<>7 THEN
  SELECT jsonb_agg(jsonb_build_object('i',t.i,'o',(SELECT jsonb_agg(k ORDER BY random()+0*t.i) FROM generate_series(0,2) k))) INTO rs FROM (SELECT g AS i FROM generate_series(0,15) g ORDER BY random() LIMIT 7) t;
  s:=s || jsonb_build_object('riddles',rs);
 END IF;
 z:=s->>'zone'; x:=(s->>'x')::int; y:=(s->>'y')::int; duel:=coalesce((s->>'duel')::int,0);
 IF p_action='move' THEN
  IF p_x IS NULL OR p_y IS NULL OR abs(x-p_x)+abs(y-p_y)<>1 OR NOT public.treasure_v4_can_step(s,p_x,p_y) THEN RAISE EXCEPTION 'Blocked path'; END IF;
  IF z='lair' AND (p_x,p_y) IN ((12,15),(14,17),(10,13),(16,14)) THEN s:=s || '{"x":12,"y":19}'::jsonb;
  ELSE s:=s || jsonb_build_object('x',p_x,'y',p_y); END IF;
 ELSIF p_action='collect' THEN
  IF abs(x-(scrolls->z->>0)::int)+abs(y-(scrolls->z->>1)::int)>1 THEN RAISE EXCEPTION 'Scroll out of reach'; END IF;
  IF NOT(s->'scrolls' ? z) THEN s:=jsonb_set(s,'{scrolls}',s->'scrolls' || to_jsonb(z)); END IF;
 ELSIF p_action='answer' THEN
  IF p_id IS DISTINCT FROM z OR NOT(s->'scrolls' ? z) OR s->'gates' ? z THEN RAISE EXCEPTION 'No riddle here'; END IF;
  IF z='lair' THEN IF abs(x-12)+abs(y-10)>1 THEN RAISE EXCEPTION 'Reach the door first'; END IF;
  ELSIF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(portals->z) q2 WHERE (q2->>'f')::boolean AND abs(x-(q2->>'x')::int)+abs(y-(q2->>'y')::int)<=1) THEN RAISE EXCEPTION 'Reach the gate first'; END IF;
  slot:=array_position(ARRAY['meadow','wood','ravine','lair'],z)-1;
  IF p_x IS NULL OR p_x NOT BETWEEN 0 AND 2 OR (s->'riddles'->slot->'o'->>p_x)::int IS DISTINCT FROM pool[(s->'riddles'->slot->>'i')::int+1] THEN RAISE EXCEPTION 'Not quite — think again!'; END IF;
  s:=jsonb_set(s,'{gates}',s->'gates' || to_jsonb(z));
 ELSIF p_action='portal' THEN
  SELECT q2 INTO p FROM jsonb_array_elements(portals->z) q2 WHERE q2->>'t'=p_id AND abs(x-(q2->>'x')::int)+abs(y-(q2->>'y')::int)<=1;
  IF p IS NULL THEN RAISE EXCEPTION 'Reach the portal first'; END IF;
  IF (p->>'f')::boolean AND NOT(s->'gates' ? z) THEN RAISE EXCEPTION 'Answer the gatekeeper riddle first'; END IF;
  s:=s || jsonb_build_object('zone',p_id,'x',(p->>'ax')::int,'y',(p->>'ay')::int,'pet',null);
 ELSIF p_action='duel' THEN
  IF z<>'lair' OR NOT(s->'gates' ? 'lair') OR coalesce((s->>'rescued')::boolean,false) OR y<>6 OR x NOT IN (10,12,14) OR p_x IS DISTINCT FROM (x-10)/2 THEN RAISE EXCEPTION 'Stand on a duel tile'; END IF;
  tile:=(x-10)/2;
  IF (s->'riddles'->(4+duel)->'o'->>tile)::int IS DISTINCT FROM pool[(s->'riddles'->(4+duel)->>'i')::int+1] THEN s:=s || '{"x":12,"y":8}'::jsonb;
  ELSE duel:=duel+1; s:=s || jsonb_build_object('duel',duel,'rescued',duel=3);
   IF duel=3 THEN
    INSERT INTO public.user_pets(user_id) VALUES(u) ON CONFLICT DO NOTHING;
    UPDATE public.user_pets SET owned_pets=array_append(owned_pets,'golden-griffin'),updated_at=now() WHERE user_id=u AND NOT('golden-griffin'=ANY(owned_pets));
    granted:=FOUND;
   END IF;
  END IF;
 ELSIF p_action='pick' THEN
  q:=items->p_id;
  IF q IS NULL OR q->>0<>z OR abs(x-(q->>1)::int)+abs(y-(q->>2)::int)>1 THEN RAISE EXCEPTION 'Nothing to pick up here'; END IF;
  IF NOT(s->'items' ? p_id) THEN s:=jsonb_set(s,'{items}',s->'items' || to_jsonb(p_id)); END IF;
 ELSIF p_action IN ('talk','deliver') THEN
  q:=npcs->p_id;
  IF q IS NULL OR q->>'z'<>z OR abs(x-(q->>'x')::int)+abs(y-(q->>'y')::int)>1 THEN RAISE EXCEPTION 'Walk up to them first'; END IF;
  IF NOT(s->'met' ? p_id) THEN s:=jsonb_set(s,'{met}',s->'met' || to_jsonb(p_id)); END IF;
  IF p_action='deliver' AND NOT(s->'quests' ? p_id) THEN
   FOR need IN SELECT jsonb_array_elements_text(q->'need') LOOP IF NOT(s->'items' ? need) THEN RAISE EXCEPTION 'You still need to find everything they asked for'; END IF; END LOOP;
   s:=jsonb_set(s,'{quests}',s->'quests' || to_jsonb(p_id));
   IF q ? 'gear' AND NOT(s->'gear' ? (q->>'gear')) THEN s:=jsonb_set(s,'{gear}',s->'gear' || (q->'gear')); END IF;
   IF q ? 'item' AND NOT(s->'items' ? (q->>'item')) THEN s:=jsonb_set(s,'{items}',s->'items' || (q->'item')); END IF;
   INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','griffin:'||u||':quest:'||p_id,(q->>'pts')::int) ON CONFLICT(reference) DO NOTHING;
   IF FOUND THEN pts:=(q->>'pts')::int; END IF;
  END IF;
 ELSIF p_action='dig' THEN
  q:=digs->p_id;
  IF q IS NULL OR q->>0<>z OR abs(x-(q->>1)::int)+abs(y-(q->>2)::int)>1 THEN RAISE EXCEPTION 'No dig spot here'; END IF;
  IF NOT(s->'dug' ? p_id) THEN
   s:=jsonb_set(s,'{dug}',s->'dug' || to_jsonb(p_id));
   IF q->>3<>'' AND NOT(s->'items' ? (q->>3)) THEN s:=jsonb_set(s,'{items}',s->'items' || (q->3)); END IF;
   IF (q->>4)::int>0 THEN
    INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','griffin:'||u||':dig:'||p_id,(q->>4)::int) ON CONFLICT(reference) DO NOTHING;
    IF FOUND THEN pts:=(q->>4)::int; END IF;
   END IF;
  END IF;
 ELSIF p_action='bell' THEN
  IF z<>'wood' OR abs(x-3)+abs(y-16)>1 THEN RAISE EXCEPTION 'Find the frog bell first'; END IF;
  s:=s || jsonb_build_object('lily',(coalesce((s->>'lily')::int,0)+1)%3);
 ELSIF p_action='stay' THEN
  IF z<>'ravine' OR x<>8 OR y<>20 THEN RAISE EXCEPTION 'Your pet can wait on the paw plate only'; END IF;
  s:=s || '{"pet":{"x":8,"y":20}}'::jsonb;
 ELSIF p_action='switch' THEN
  IF z<>'ravine' OR x<>5 OR y<>20 OR coalesce(s->'pet'->>'x','')<>'8' THEN RAISE EXCEPTION 'Both plates must be pressed at once'; END IF;
  IF NOT(s->'quests' ? 'vault') THEN
   s:=jsonb_set(s,'{quests}',s->'quests' || '"vault"'::jsonb);
   IF NOT(s->'items' ? 'relic-sun-stone') THEN s:=jsonb_set(s,'{items}',s->'items' || '"relic-sun-stone"'::jsonb); END IF;
   INSERT INTO public.point_credits(user_id,source,reference,points) VALUES(u,'game_round','griffin:'||u||':vault',40) ON CONFLICT(reference) DO NOTHING;
   IF FOUND THEN pts:=40; END IF;
  END IF;
  s:=s || '{"pet":null}'::jsonb;
 ELSIF p_action='call' THEN s:=s || '{"pet":null}'::jsonb;
 ELSIF p_action<>'status' THEN RAISE EXCEPTION 'Unknown action'; END IF;
 s:=public.treasure_v4_reveal(s);
 UPDATE public.treasure_saves SET state=s,updated_at=now() WHERE user_id=u;
 RETURN jsonb_build_object('state',s,'griffin',granted,'points',pts);
END $$;