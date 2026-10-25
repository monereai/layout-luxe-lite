create or replace function public.energy_overflow_convert()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare p public.profiles; conversions integer; payout integer;
begin
  if auth.uid() is null then raise exception 'Sign in to convert energy'; end if;
  insert into public.profiles(user_id) values(auth.uid()) on conflict do nothing;
  select * into p from public.profiles where user_id = auth.uid() for update;
  if p.monere_energy < 100 then
    return jsonb_build_object('energy', p.monere_energy, 'points', 0);
  end if;
  conversions := floor(p.monere_energy / 100)::integer;
  payout := conversions * 5;
  p.monere_energy := p.monere_energy - conversions * 100;
  insert into public.point_credits(user_id, source, reference, points)
    values(auth.uid(), 'energy_overflow', 'energy-overflow:' || auth.uid() || ':' || gen_random_uuid(), payout);
  update public.profiles set monere_energy = p.monere_energy where user_id = auth.uid();
  return jsonb_build_object('energy', p.monere_energy, 'points', payout);
end;
$function$;
revoke all on function public.energy_overflow_convert() from public, anon;
grant execute on function public.energy_overflow_convert() to authenticated;