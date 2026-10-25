alter table public.profiles add column if not exists energy_overflow integer not null default 0;
drop function public.energy_overflow_convert();
create or replace function public.energy_overflow_credit(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare p public.profiles; accumulated integer; payout integer;
begin
  if auth.uid() is null then raise exception 'Sign in to convert energy'; end if;
  if p_amount < 0 or p_amount > 100 then raise exception 'Invalid overflow amount'; end if;
  insert into public.profiles(user_id) values(auth.uid()) on conflict do nothing;
  select * into p from public.profiles where user_id = auth.uid() for update;
  accumulated := p.energy_overflow + p_amount;
  payout := floor(accumulated / 100)::integer * 5;
  accumulated := accumulated % 100;
  if payout > 0 then
    insert into public.point_credits(user_id, source, reference, points)
      values(auth.uid(), 'energy_overflow', 'energy-overflow:' || auth.uid() || ':' || gen_random_uuid(), payout);
  end if;
  update public.profiles set energy_overflow = accumulated where user_id = auth.uid();
  return jsonb_build_object('overflow', accumulated, 'points', payout);
end;
$function$;
revoke all on function public.energy_overflow_credit(p_amount integer) from public, anon;
grant execute on function public.energy_overflow_credit(p_amount integer) to authenticated;