CREATE OR REPLACE FUNCTION public.treasure_draw_hunt(s jsonb) RETURNS jsonb LANGUAGE sql VOLATILE SET search_path=public AS $$
 WITH eligible AS (
 SELECT i FROM generate_series(0,11) i
 WHERE public.treasure_hunt_pool()->i->>0='meadow'
 OR (public.treasure_hunt_pool()->i->>0='wood' AND s->'gates' ? 'meadow')
 OR (public.treasure_hunt_pool()->i->>0='ravine' AND s->'gates' ? 'wood')
 ), fresh AS (
 SELECT i FROM eligible WHERE NOT coalesce(s->'huntSpots','[]'::jsonb) @> jsonb_build_array(i)
 ), chosen AS (
 SELECT i FROM eligible ORDER BY CASE WHEN (SELECT count(*) FROM fresh)>=3 AND i IN (SELECT i FROM fresh) THEN 0 ELSE 1 END, random() LIMIT 3
 ) SELECT jsonb_agg(i) FROM chosen;
 $$;
DO $$
DECLARE s jsonb; spots jsonb; n int;
BEGIN
 s := '{"gates":["meadow","wood"],"huntSpots":[0,1,2]}'::jsonb;
 FOR n IN 1..20 LOOP
 spots := public.treasure_draw_hunt(s);
 IF jsonb_array_length(spots)<>3 OR EXISTS (SELECT 1 FROM jsonb_array_elements(spots) v WHERE s->'huntSpots' @> jsonb_build_array(v)) THEN RAISE EXCEPTION 'Hunt must draw three new unlocked targets'; END IF;
 END LOOP;
 s := '{"gates":[],"huntSpots":[0,1,2]}'::jsonb;
 spots := public.treasure_draw_hunt(s);
 IF jsonb_array_length(spots)<>3 OR (SELECT count(DISTINCT v) FROM jsonb_array_elements(spots) v)<>3 OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(spots) v WHERE v::int NOT BETWEEN 0 AND 3) THEN RAISE EXCEPTION 'Meadow fallback must draw three unique reachable targets'; END IF;
END $$;
NOTIFY pgrst,'reload schema';