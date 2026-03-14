create table if not exists public.onboarding_presets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category, value)
);

create index if not exists onboarding_presets_category_sort_idx
  on public.onboarding_presets(category, sort_order, label);

alter table public.onboarding_presets enable row level security;

create policy onboarding_presets_select on public.onboarding_presets
for select
to authenticated
using (auth.uid() is not null);

insert into public.onboarding_presets (category, label, value, sort_order)
values
  ('job_title', 'System Administrator', 'System Administrator', 10),
  ('job_title', 'Logistics Manager', 'Logistics Manager', 20),
  ('job_title', 'Billing Manager', 'Billing Manager', 30),
  ('job_title', 'Operations Lead', 'Operations Lead', 40),
  ('company_name', 'Northstar Freight', 'Northstar Freight', 10),
  ('company_name', 'Atlas Supply Chain', 'Atlas Supply Chain', 20),
  ('company_name', 'Summit Logistics Group', 'Summit Logistics Group', 30),
  ('company_name', 'Vector Carrier Network', 'Vector Carrier Network', 40),
  ('region_name', 'North America', 'North America', 10),
  ('region_name', 'EMEA', 'EMEA', 20),
  ('region_name', 'APAC', 'APAC', 30),
  ('business_unit_name', 'Enterprise Logistics', 'Enterprise Logistics', 10),
  ('business_unit_name', 'Retail Distribution', 'Retail Distribution', 20),
  ('business_unit_name', 'Parcel Operations', 'Parcel Operations', 30),
  ('facility_name', 'Austin Distribution Hub', 'Austin Distribution Hub', 10),
  ('facility_name', 'Chicago Freight Center', 'Chicago Freight Center', 20),
  ('facility_name', 'Memphis Carrier Gateway', 'Memphis Carrier Gateway', 30),
  ('facility_city', 'Austin', 'Austin', 10),
  ('facility_city', 'Chicago', 'Chicago', 20),
  ('facility_city', 'Memphis', 'Memphis', 30),
  ('facility_country', 'United States', 'United States', 10),
  ('facility_country', 'Canada', 'Canada', 20),
  ('facility_country', 'United Kingdom', 'United Kingdom', 30)
on conflict (category, value) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;
