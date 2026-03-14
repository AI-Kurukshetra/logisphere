create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  business_unit_id uuid references public.business_units(id) on delete set null,
  fiscal_year integer not null,
  total_budget numeric(14,2) not null default 0,
  budget_by_carrier jsonb not null default '{}'::jsonb,
  budget_by_lane jsonb not null default '{}'::jsonb,
  scenario_assumptions jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, fiscal_year)
);

create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null,
  forecast_period text not null default 'monthly',
  start_month integer not null,
  start_year integer not null,
  months integer not null default 12,
  algorithm text not null default 'linear_regression',
  accuracy_score numeric(5,2),
  status text not null default 'completed',
  forecast_data jsonb not null default '[]'::jsonb,
  scenario_data jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_vs_actual (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  budget_id uuid references public.budgets(id) on delete set null,
  fiscal_month integer not null check (fiscal_month between 1 and 12),
  fiscal_year integer not null,
  budget_amount numeric(14,2) not null default 0,
  actual_amount numeric(14,2) not null default 0,
  variance numeric(14,2) not null default 0,
  variance_percent numeric(7,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, fiscal_year, fiscal_month)
);

create table if not exists public.optimization_recommendations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  carrier_id uuid references public.carriers(id) on delete set null,
  lane_key text,
  recommendation_type text not null,
  title text not null,
  summary text not null,
  feasibility text,
  impact_score numeric(5,2),
  estimated_savings numeric(14,2),
  savings_percent numeric(7,2),
  status text not null default 'open',
  supporting_data jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  origin_zone text not null,
  destination_zone text not null,
  weight_kg numeric(10,2) not null,
  service_type text not null default 'ground',
  requested_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_quote_options (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.rate_quotes(id) on delete cascade,
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  rate_id uuid references public.rates(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  base_rate numeric(12,2) not null default 0,
  accessorial_charges numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  contract_discount_percent numeric(7,2) not null default 0,
  final_cost numeric(12,2) not null default 0,
  estimated_delivery_days integer,
  estimated_delivery_date date,
  performance_score numeric(5,2),
  ranking integer not null,
  recommendation text not null default 'balanced',
  selected boolean not null default false,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists budgets_company_year_idx
  on public.budgets(company_id, fiscal_year desc);

create index if not exists forecasts_company_created_at_idx
  on public.forecasts(company_id, created_at desc);

create index if not exists budget_vs_actual_company_year_idx
  on public.budget_vs_actual(company_id, fiscal_year, fiscal_month);

create index if not exists optimization_recommendations_company_created_at_idx
  on public.optimization_recommendations(company_id, created_at desc);

create index if not exists rate_quotes_company_requested_at_idx
  on public.rate_quotes(company_id, requested_at desc);

create index if not exists rate_quote_options_quote_ranking_idx
  on public.rate_quote_options(quote_id, ranking);

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

drop trigger if exists set_optimization_recommendations_updated_at on public.optimization_recommendations;
create trigger set_optimization_recommendations_updated_at
before update on public.optimization_recommendations
for each row
execute function public.set_updated_at();

alter table public.budgets enable row level security;
alter table public.forecasts enable row level security;
alter table public.budget_vs_actual enable row level security;
alter table public.optimization_recommendations enable row level security;
alter table public.rate_quotes enable row level security;
alter table public.rate_quote_options enable row level security;

create policy budgets_select on public.budgets
for select
to authenticated
using (public.is_company_member(company_id));

create policy budgets_insert on public.budgets
for insert
to authenticated
with check (public.has_permission('payments.manage', company_id));

create policy budgets_update on public.budgets
for update
to authenticated
using (public.has_permission('payments.manage', company_id))
with check (public.has_permission('payments.manage', company_id));

create policy budgets_delete on public.budgets
for delete
to authenticated
using (public.has_permission('payments.manage', company_id));

create policy forecasts_select on public.forecasts
for select
to authenticated
using (public.is_company_member(company_id));

create policy forecasts_insert on public.forecasts
for insert
to authenticated
with check (public.has_permission('payments.manage', company_id));

create policy forecasts_delete on public.forecasts
for delete
to authenticated
using (public.has_permission('payments.manage', company_id));

create policy budget_vs_actual_select on public.budget_vs_actual
for select
to authenticated
using (public.is_company_member(company_id));

create policy budget_vs_actual_insert on public.budget_vs_actual
for insert
to authenticated
with check (public.has_permission('payments.manage', company_id));

create policy budget_vs_actual_update on public.budget_vs_actual
for update
to authenticated
using (public.has_permission('payments.manage', company_id))
with check (public.has_permission('payments.manage', company_id));

create policy budget_vs_actual_delete on public.budget_vs_actual
for delete
to authenticated
using (public.has_permission('payments.manage', company_id));

create policy optimization_recommendations_select on public.optimization_recommendations
for select
to authenticated
using (public.is_company_member(company_id));

create policy optimization_recommendations_insert on public.optimization_recommendations
for insert
to authenticated
with check (
  public.has_permission('payments.manage', company_id)
  or public.has_permission('rates.manage', company_id)
);

create policy optimization_recommendations_update on public.optimization_recommendations
for update
to authenticated
using (
  public.has_permission('payments.manage', company_id)
  or public.has_permission('rates.manage', company_id)
)
with check (
  public.has_permission('payments.manage', company_id)
  or public.has_permission('rates.manage', company_id)
);

create policy optimization_recommendations_delete on public.optimization_recommendations
for delete
to authenticated
using (
  public.has_permission('payments.manage', company_id)
  or public.has_permission('rates.manage', company_id)
);

create policy rate_quotes_select on public.rate_quotes
for select
to authenticated
using (public.is_company_member(company_id));

create policy rate_quotes_insert on public.rate_quotes
for insert
to authenticated
with check (public.has_permission('rates.manage', company_id));

create policy rate_quotes_update on public.rate_quotes
for update
to authenticated
using (public.has_permission('rates.manage', company_id))
with check (public.has_permission('rates.manage', company_id));

create policy rate_quotes_delete on public.rate_quotes
for delete
to authenticated
using (public.has_permission('rates.manage', company_id));

create policy rate_quote_options_select on public.rate_quote_options
for select
to authenticated
using (
  exists (
    select 1
    from public.rate_quotes rq
    where rq.id = quote_id
      and public.is_company_member(rq.company_id)
  )
);

create policy rate_quote_options_insert on public.rate_quote_options
for insert
to authenticated
with check (
  exists (
    select 1
    from public.rate_quotes rq
    where rq.id = quote_id
      and public.has_permission('rates.manage', rq.company_id)
  )
);

create policy rate_quote_options_update on public.rate_quote_options
for update
to authenticated
using (
  exists (
    select 1
    from public.rate_quotes rq
    where rq.id = quote_id
      and public.has_permission('rates.manage', rq.company_id)
  )
)
with check (
  exists (
    select 1
    from public.rate_quotes rq
    where rq.id = quote_id
      and public.has_permission('rates.manage', rq.company_id)
  )
);

create policy rate_quote_options_delete on public.rate_quote_options
for delete
to authenticated
using (
  exists (
    select 1
    from public.rate_quotes rq
    where rq.id = quote_id
      and public.has_permission('rates.manage', rq.company_id)
  )
);
