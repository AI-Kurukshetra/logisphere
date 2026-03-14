create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists carriers_delete on public.carriers;
drop policy if exists carriers_insert on public.carriers;
drop policy if exists carriers_select on public.carriers;
drop policy if exists carriers_update on public.carriers;

create policy carriers_select on public.carriers
for select
to authenticated
using (auth.uid() is not null);

create policy carriers_insert on public.carriers
for insert
to authenticated
with check (public.has_permission('carriers.manage', public.current_company_id()));

create policy carriers_update on public.carriers
for update
to authenticated
using (public.has_permission('carriers.manage', public.current_company_id()))
with check (public.has_permission('carriers.manage', public.current_company_id()));

create policy carriers_delete on public.carriers
for delete
to authenticated
using (public.has_permission('carriers.manage', public.current_company_id()));

drop policy if exists rates_delete on public.rates;
drop policy if exists rates_insert on public.rates;
drop policy if exists rates_select on public.rates;
drop policy if exists rates_update on public.rates;

create policy rates_select on public.rates
for select
to authenticated
using (
  auth.uid() is not null
  and (
    contract_id is null
    or exists (
      select 1
      from public.contracts c
      where c.id = rates.contract_id
        and c.company_id = public.current_company_id()
    )
  )
);

create policy rates_insert on public.rates
for insert
to authenticated
with check (
  public.has_permission('rates.manage', public.current_company_id())
  and (
    contract_id is null
    or exists (
      select 1
      from public.contracts c
      where c.id = rates.contract_id
        and c.company_id = public.current_company_id()
    )
  )
);

create policy rates_update on public.rates
for update
to authenticated
using (public.has_permission('rates.manage', public.current_company_id()))
with check (
  public.has_permission('rates.manage', public.current_company_id())
  and (
    contract_id is null
    or exists (
      select 1
      from public.contracts c
      where c.id = rates.contract_id
        and c.company_id = public.current_company_id()
    )
  )
);

create policy rates_delete on public.rates
for delete
to authenticated
using (public.has_permission('rates.manage', public.current_company_id()));
