DO $patch$
DECLARE d text;
BEGIN
 SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='connie_arcade_commit';
 d:=replace(d,'s jsonb; e integer;','s jsonb; e integer; c integer:=0;');
 d:=replace(d,'ON CONFLICT(reference) DO NOTHING; s:=s||jsonb_build_object','ON CONFLICT(reference) DO NOTHING; IF FOUND THEN c:=20; END IF; s:=s||jsonb_build_object');
 d:=replace(d,$old$jsonb_build_object('energy',e,'state',s)$old$,$new$jsonb_build_object('energy',e,'state',s,'coins',c)$new$);
 EXECUTE d;
 SELECT pg_get_functiondef(oid) INTO d FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='orchard_maze_settle_scroll';
 d:=replace(d,'scroll_awarded boolean:=false;','scroll_awarded boolean:=false; bonus integer:=0;');
 d:=replace(d,'ELSE PERFORM public.energy_overflow_internal(p_user,p_energy-g);','ELSE bonus:=public.energy_overflow_internal(p_user,p_energy-g);');
 d:=replace(d,$old$'scrollAwarded',false)$old$,$new$'scrollAwarded',false,'overflowPoints',0)$new$);
 d:=replace(d,$old$'scrollAwarded',scroll_awarded)$old$,$new$'scrollAwarded',scroll_awarded,'overflowPoints',bonus)$new$);
 EXECUTE d;
END $patch$;