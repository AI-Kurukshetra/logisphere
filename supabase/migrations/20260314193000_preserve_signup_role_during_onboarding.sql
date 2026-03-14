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
      if new.role not in ('admin', 'viewer', 'billing_manager', 'supply_chain_manager', 'drivers_carriers') then
        raise exception 'Initial onboarding role must be a valid signup role or admin';
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
