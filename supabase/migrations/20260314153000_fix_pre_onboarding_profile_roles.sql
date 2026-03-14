create or replace function public.enforce_profile_scope_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if old.id = auth.uid() then
    if old.company_id is null and new.company_id is null then
      if new.role not in ('viewer', 'billing_manager', 'supply_chain_manager', 'drivers_carriers') then
        raise exception 'Pre-onboarding role must be a signup role';
      end if;

      if new.region_id is distinct from old.region_id
        or new.business_unit_id is distinct from old.business_unit_id
        or new.facility_id is distinct from old.facility_id then
        raise exception 'Cannot assign org scope before onboarding';
      end if;

      return new;
    end if;

    if old.company_id is null and new.company_id is not null then
      if new.role <> 'admin' then
        raise exception 'Initial onboarding must create an admin profile';
      end if;

      if exists (
        select 1
        from public.profiles p
        where p.company_id = new.company_id
          and p.id <> old.id
      ) then
        raise exception 'Cannot self-assign to an existing company';
      end if;

      return new;
    end if;

    if not public.is_company_admin(old.company_id) then
      if new.role is distinct from old.role
        or new.company_id is distinct from old.company_id
        or new.region_id is distinct from old.region_id
        or new.business_unit_id is distinct from old.business_unit_id
        or new.facility_id is distinct from old.facility_id then
        raise exception 'Only admins can change access scope';
      end if;
    end if;

    return new;
  end if;

  if not public.is_company_admin(old.company_id) then
    raise exception 'Only admins can edit other profiles';
  end if;

  return new;
end;
$$;

update public.profiles p
set role = case
  when coalesce(u.raw_app_meta_data ->> 'platform_role', '') = 'admin' then 'admin'::public.user_role
  when coalesce(u.raw_user_meta_data ->> 'role', '') in ('billing_manager', 'supply_chain_manager', 'drivers_carriers')
    then (u.raw_user_meta_data ->> 'role')::public.user_role
  else p.role
end
from auth.users u
where u.id = p.id
  and p.company_id is null
  and (
    (p.role = 'viewer' and coalesce(u.raw_user_meta_data ->> 'role', '') in ('billing_manager', 'supply_chain_manager', 'drivers_carriers'))
    or (coalesce(u.raw_app_meta_data ->> 'platform_role', '') = 'admin' and p.role <> 'admin')
  );
