-- Vernon's three magic seeds now ring the sleeping-cat boulder just north of the starting clearing,
-- well away from Vernon at (11,19). Mirrors ITEMS in src/lib/treasure.ts.
do $$
declare
  r record;
  body text;
begin
  for r in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('treasure_v5_action', 'treasure_v6_action')
  loop
    body := pg_get_functiondef(r.oid);
    body := replace(body, '"seed-2":["meadow",11,14]', '"seed-2":["meadow",14,10]');
    body := replace(body, '"seed-3":["meadow",10,17]', '"seed-3":["meadow",12,8]');
    execute body;
  end loop;
end $$;
