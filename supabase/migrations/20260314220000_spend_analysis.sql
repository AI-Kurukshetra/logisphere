-- Spend Analysis Module
-- Tables: budgets, forecasts, budget_vs_actual, optimization_recommendations, budget_plans, carrier_metrics

create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  fiscal_year integer not null,
  total_budget numeric not null default 0,
  budget_by_carrier jsonb,
  budget_by_lane jsonb,
  scenario_assumptions jsonb,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(company_id, fiscal_year)
);

create table if not exists forecasts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  budget_id uuid references budgets(id) on delete set null,
  algorithm text not null default 'linear_regression',
  forecast_period text not null default 'monthly',
  months integer not null,
  start_year integer,
  start_month integer,
  forecast_data jsonb not null,
  scenario_data jsonb,
  accuracy_score integer default 0,
  status text default 'completed',
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists budget_vs_actual (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  budget_id uuid references budgets(id) on delete set null,
  fiscal_year integer not null,
  fiscal_month integer not null,
  budget_amount numeric not null default 0,
  actual_amount numeric not null default 0,
  variance numeric,
  variance_percent numeric,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists optimization_recommendations (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  recommendation_type text not null,
  title text not null,
  summary text,
  carrier_id uuid references carriers(id) on delete set null,
  lane_key text,
  feasibility text default 'medium',
  impact_score numeric default 0,
  estimated_savings numeric default 0,
  savings_percent numeric default 0,
  supporting_data jsonb,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists budget_plans (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  budget_id uuid references budgets(id) on delete cascade,
  fiscal_month integer not null,
  monthly_budget numeric not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists carrier_metrics (
  id uuid default gen_random_uuid() primary key,
  company_id uuid not null references companies(id) on delete cascade,
  carrier_id uuid not null references carriers(id) on delete cascade,
  period_end timestamp with time zone,
  on_time_rate numeric,
  score numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes
create index idx_budgets_company_id on budgets(company_id);
create index idx_forecasts_company_id on forecasts(company_id);
create index idx_budget_vs_actual_company_id on budget_vs_actual(company_id);
create index idx_optimization_recommendations_company_id on optimization_recommendations(company_id);
create index idx_budget_plans_company_id on budget_plans(company_id);
create index idx_carrier_metrics_company_id on carrier_metrics(company_id);

-- Enable RLS
alter table budgets enable row level security;
alter table forecasts enable row level security;
alter table budget_vs_actual enable row level security;
alter table optimization_recommendations enable row level security;
alter table budget_plans enable row level security;
alter table carrier_metrics enable row level security;

-- RLS Policies
-- budgets policies
create policy "budgets_select" on budgets for select
  using (is_company_member(company_id));

create policy "budgets_insert" on budgets for insert
  with check (is_company_member(company_id) and has_permission('payments.manage'));

create policy "budgets_update" on budgets for update
  using (is_company_member(company_id) and has_permission('payments.manage'));

create policy "budgets_delete" on budgets for delete
  using (is_company_member(company_id) and has_permission('payments.manage'));

-- forecasts policies
create policy "forecasts_select" on forecasts for select
  using (is_company_member(company_id));

create policy "forecasts_insert" on forecasts for insert
  with check (is_company_member(company_id) and has_permission('payments.manage'));

create policy "forecasts_delete" on forecasts for delete
  using (is_company_member(company_id) and has_permission('payments.manage'));

-- budget_vs_actual policies
create policy "budget_vs_actual_select" on budget_vs_actual for select
  using (is_company_member(company_id));

create policy "budget_vs_actual_insert" on budget_vs_actual for insert
  with check (is_company_member(company_id) and has_permission('payments.manage'));

create policy "budget_vs_actual_delete" on budget_vs_actual for delete
  using (is_company_member(company_id) and has_permission('payments.manage'));

-- optimization_recommendations policies
create policy "optimization_recommendations_select" on optimization_recommendations for select
  using (is_company_member(company_id));

create policy "optimization_recommendations_insert" on optimization_recommendations for insert
  with check (is_company_member(company_id) and has_permission('audit.read'));

create policy "optimization_recommendations_delete" on optimization_recommendations for delete
  using (is_company_member(company_id) and has_permission('audit.read'));

-- budget_plans policies
create policy "budget_plans_select" on budget_plans for select
  using (is_company_member(company_id));

create policy "budget_plans_insert" on budget_plans for insert
  with check (is_company_member(company_id) and has_permission('payments.manage'));

-- carrier_metrics policies
create policy "carrier_metrics_select" on carrier_metrics for select
  using (is_company_member(company_id));

create policy "carrier_metrics_insert" on carrier_metrics for insert
  with check (is_company_member(company_id) and has_permission('audit.read'));
