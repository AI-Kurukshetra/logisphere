-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types (enums)
CREATE TYPE shipment_status AS ENUM ('created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception');
CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'exception', 'paid', 'disputed');
CREATE TYPE approval_status AS ENUM ('pending_approval', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE dispute_status AS ENUM ('open', 'resolved');
CREATE TYPE carrier_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer', 'billing_manager', 'supply_chain_manager', 'drivers_carriers');

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role user_role DEFAULT 'viewer' NOT NULL,
  job_title TEXT,
  region_id UUID,
  facility_id UUID,
  business_unit_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create business_units table
CREATE TABLE IF NOT EXISTS business_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  business_unit_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT,
  address JSONB DEFAULT '{}',
  type TEXT DEFAULT 'hub',
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Update profiles table with facility_id foreign key
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_facility
  FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_region
  FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE SET NULL;

ALTER TABLE profiles ADD CONSTRAINT fk_profiles_business_unit
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL;

-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status carrier_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  name TEXT,
  terms TEXT,
  sla JSONB DEFAULT '{}',
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rates table
CREATE TABLE IF NOT EXISTS rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  origin_zone TEXT,
  dest_zone TEXT,
  weight_kg_min NUMERIC(12, 2),
  weight_kg_max NUMERIC(12, 2),
  rate_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  tracking_number TEXT,
  origin_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  destination_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  status shipment_status DEFAULT 'created' NOT NULL,
  weight_kg NUMERIC(12, 2),
  service_type TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL,
  invoice_number TEXT,
  invoice_date DATE,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status invoice_status DEFAULT 'pending' NOT NULL,
  audit_status TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_regions_company_id ON regions(company_id);
CREATE INDEX idx_business_units_company_id ON business_units(company_id);
CREATE INDEX idx_facilities_company_id ON facilities(company_id);
CREATE INDEX idx_shipments_company_id ON shipments(company_id);
CREATE INDEX idx_invoices_company_id ON invoices(company_id);
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Companies
-- Allow users to see their own company
CREATE POLICY "users_see_own_company"
  ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Allow service role to insert companies (during onboarding)
CREATE POLICY "service_role_insert_companies"
  ON companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- RLS Policies: Profiles
-- Allow users to see their own profile
CREATE POLICY "users_see_own_profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Allow authenticated users to insert their profile (signup)
CREATE POLICY "authenticated_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Allow company members to see other profiles in same company
CREATE POLICY "company_members_see_profiles"
  ON profiles FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- RLS Policies: Regions
CREATE POLICY "users_see_company_regions"
  ON regions FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "users_insert_company_regions"
  ON regions FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Business Units
CREATE POLICY "users_see_company_business_units"
  ON business_units FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "users_insert_company_business_units"
  ON business_units FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Facilities
CREATE POLICY "users_see_company_facilities"
  ON facilities FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "users_insert_company_facilities"
  ON facilities FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Shipments
CREATE POLICY "users_see_company_shipments"
  ON shipments FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Invoices
CREATE POLICY "users_see_company_invoices"
  ON invoices FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Activity Logs
CREATE POLICY "users_see_company_activity_logs"
  ON activity_logs FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "users_insert_activity_logs"
  ON activity_logs FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- RLS Policies: Carriers (global, no RLS filtering needed for reads, but restrict writes)
CREATE POLICY "anyone_can_see_carriers"
  ON carriers FOR SELECT
  USING (true);

-- RLS Policies: Contracts
CREATE POLICY "users_see_company_contracts"
  ON contracts FOR SELECT
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
