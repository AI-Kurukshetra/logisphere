create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.business_units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  region_id uuid references public.regions(id) on delete set null,
  name text not null,
  code text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.facilities
  add column if not exists region_id uuid references public.regions(id) on delete set null,
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null,
  add column if not exists code text,
  add column if not exists status text not null default 'active',
  add column if not exists contact_name text,
  add column if not exists contact_email text;

alter table public.profiles
  add column if not exists job_title text,
  add column if not exists region_id uuid references public.regions(id) on delete set null,
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null,
  add column if not exists facility_id uuid references public.facilities(id) on delete set null;

create table if not exists public.permissions (
  key text primary key,
  category text not null,
  label text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role public.user_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role, permission_key)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists regions_company_id_idx on public.regions(company_id);
create index if not exists business_units_company_id_idx on public.business_units(company_id);
create index if not exists business_units_region_id_idx on public.business_units(region_id);
create index if not exists facilities_region_id_idx on public.facilities(region_id);
create index if not exists facilities_business_unit_id_idx on public.facilities(business_unit_id);
create index if not exists profiles_region_id_idx on public.profiles(region_id);
create index if not exists profiles_business_unit_id_idx on public.profiles(business_unit_id);
create index if not exists profiles_facility_id_idx on public.profiles(facility_id);
create index if not exists activity_logs_company_id_created_at_idx on public.activity_logs(company_id, created_at desc);
create unique index if not exists facilities_company_code_idx on public.facilities(company_id, code) where code is not null;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and company_id = target_company_id
    );
$$;

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and company_id = target_company_id
        and role = 'admin'
    );
$$;

create or replace function public.has_permission(required_permission text, target_company_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles p
      join public.role_permissions rp on rp.role = p.role
      where p.id = auth.uid()
        and (target_company_id is null or p.company_id = target_company_id)
        and rp.permission_key = required_permission
    );
$$;

create or replace function public.enforce_profile_scope_changes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if old.id = auth.uid() then
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

drop trigger if exists enforce_profile_scope_changes on public.profiles;
create trigger enforce_profile_scope_changes
before update on public.profiles
for each row
execute function public.enforce_profile_scope_changes();

drop trigger if exists set_regions_updated_at on public.regions;
create trigger set_regions_updated_at
before update on public.regions
for each row
execute function public.set_updated_at();

drop trigger if exists set_business_units_updated_at on public.business_units;
create trigger set_business_units_updated_at
before update on public.business_units
for each row
execute function public.set_updated_at();

alter table public.regions enable row level security;
alter table public.business_units enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists companies_insert on public.companies;
drop policy if exists companies_select on public.companies;
drop policy if exists companies_update on public.companies;

create policy companies_insert on public.companies
for insert
to authenticated
with check (auth.uid() is not null);

create policy companies_select on public.companies
for select
to authenticated
using (public.is_company_member(id));

create policy companies_update on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;

create policy profiles_insert on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  or public.is_company_admin(company_id)
);

create policy profiles_select on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_company_member(company_id)
);

create policy profiles_update on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_company_admin(company_id)
)
with check (
  id = auth.uid()
  or public.is_company_admin(company_id)
);

drop policy if exists facilities_delete on public.facilities;
drop policy if exists facilities_insert on public.facilities;
drop policy if exists facilities_select on public.facilities;
drop policy if exists facilities_update on public.facilities;

create policy facilities_select on public.facilities
for select
to authenticated
using (public.is_company_member(company_id));

create policy facilities_insert on public.facilities
for insert
to authenticated
with check (public.is_company_admin(company_id));

create policy facilities_update on public.facilities
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy facilities_delete on public.facilities
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy regions_select on public.regions
for select
to authenticated
using (public.is_company_member(company_id));

create policy regions_insert on public.regions
for insert
to authenticated
with check (public.is_company_admin(company_id));

create policy regions_update on public.regions
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy regions_delete on public.regions
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy business_units_select on public.business_units
for select
to authenticated
using (public.is_company_member(company_id));

create policy business_units_insert on public.business_units
for insert
to authenticated
with check (public.is_company_admin(company_id));

create policy business_units_update on public.business_units
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy business_units_delete on public.business_units
for delete
to authenticated
using (public.is_company_admin(company_id));

create policy permissions_select on public.permissions
for select
to authenticated
using (auth.uid() is not null);

create policy role_permissions_select on public.role_permissions
for select
to authenticated
using (auth.uid() is not null);

create policy activity_logs_select on public.activity_logs
for select
to authenticated
using (public.is_company_member(company_id));

create policy activity_logs_insert on public.activity_logs
for insert
to authenticated
with check (
  company_id = public.current_company_id()
  and actor_profile_id = auth.uid()
);

insert into public.permissions (key, category, label, description)
values
  ('users.manage', 'access', 'Manage users', 'Manage user membership and profile scope assignments.'),
  ('roles.manage', 'access', 'Manage roles', 'Assign and change platform roles for company users.'),
  ('company.manage', 'organization', 'Manage company', 'Update company-level settings and metadata.'),
  ('regions.manage', 'organization', 'Manage regions', 'Create and update regional hierarchy records.'),
  ('business_units.manage', 'organization', 'Manage business units', 'Create and update business unit records.'),
  ('facilities.manage', 'organization', 'Manage facilities', 'Create and update facility records.'),
  ('audit.read', 'oversight', 'Read audit trail', 'Review operational access and hierarchy changes.')
on conflict (key) do update
set
  category = excluded.category,
  label = excluded.label,
  description = excluded.description;

insert into public.role_permissions (role, permission_key)
values
  ('admin', 'users.manage'),
  ('admin', 'roles.manage'),
  ('admin', 'company.manage'),
  ('admin', 'regions.manage'),
  ('admin', 'business_units.manage'),
  ('admin', 'facilities.manage'),
  ('admin', 'audit.read'),
  ('manager', 'regions.manage'),
  ('manager', 'business_units.manage'),
  ('manager', 'facilities.manage'),
  ('manager', 'audit.read')
on conflict (role, permission_key) do nothing;
