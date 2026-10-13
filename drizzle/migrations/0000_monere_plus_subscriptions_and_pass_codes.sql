create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  environment text not null default 'sandbox',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);

create table public.organization_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  organization_name text not null,
  is_active boolean not null default true,
  max_uses integer not null default 100,
  current_uses integer not null default 0,
  expiration_date timestamptz not null,
  created_at timestamptz not null default now()
);
grant all on public.organization_codes to service_role;
alter table public.organization_codes enable row level security;

create table public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code_id uuid not null references public.organization_codes(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (user_id, code_id)
);
grant select on public.code_redemptions to authenticated;
grant all on public.code_redemptions to service_role;
alter table public.code_redemptions enable row level security;
create policy "Users can view own redemptions" on public.code_redemptions for select to authenticated using (auth.uid() = user_id);

create or replace function public.redeem_org_code(p_code text)
returns table (ok boolean, organization_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row public.organization_codes%rowtype;
begin
  if v_uid is null then
    return query select false, null::text; return;
  end if;
  select * into v_row from public.organization_codes
    where upper(code) = upper(trim(p_code)) for update;
  if not found or not v_row.is_active or v_row.expiration_date <= now() then
    return query select false, null::text; return;
  end if;
  if exists (select 1 from public.code_redemptions r where r.user_id = v_uid and r.code_id = v_row.id) then
    return query select true, v_row.organization_name; return;
  end if;
  if v_row.current_uses >= v_row.max_uses then
    return query select false, null::text; return;
  end if;
  update public.organization_codes set current_uses = current_uses + 1 where id = v_row.id;
  insert into public.code_redemptions (user_id, code_id) values (v_uid, v_row.id);
  return query select true, v_row.organization_name;
end;
$$;
revoke all on function public.redeem_org_code(text) from public, anon;
grant execute on function public.redeem_org_code(text) to authenticated;

create or replace function public.is_premium(check_env text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid() and s.environment = check_env and (
        (s.status in ('active','trialing','past_due') and (s.current_period_end is null or s.current_period_end > now()))
        or (s.status = 'canceled' and s.current_period_end > now())
      )
    )
    or exists (
      select 1 from public.code_redemptions r join public.organization_codes c on c.id = r.code_id
      where r.user_id = auth.uid() and c.is_active and c.expiration_date > now()
    )
  );
$$;
revoke all on function public.is_premium(text) from public, anon;
grant execute on function public.is_premium(text) to authenticated;

insert into public.organization_codes (code, organization_name, max_uses, expiration_date)
values ('STMARKS2026', 'St. Mark''s Youth Group', 100, '2026-12-31 23:59:59+00');