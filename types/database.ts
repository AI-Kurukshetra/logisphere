export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "admin"
  | "manager"
  | "viewer"
  | "billing_manager"
  | "supply_chain_manager"
  | "drivers_carriers";
export type ShipmentStatus =
  | "created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";
export type InvoiceStatus =
  | "pending"
  | "approved"
  | "exception"
  | "paid"
  | "disputed";
export type ApprovalStatus = "pending_approval" | "approved" | "rejected";
export type CarrierStatus = "active" | "inactive";
export type AlertRuleType = "cost_overrun" | "service_failure" | "invoice_exception" | "payment_delay" | "carrier_sla";
export type RecommendationType = "budget_guardrail" | "carrier_budget_gap" | "lane_variance" | "carrier_rebalance" | "ai_copilot";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          settings: Json | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          settings?: Json | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          settings?: Json | null;
          slug?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company_id: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: UserRole;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: UserRole;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: UserRole;
          updated_at?: string;
        };
      };
      carriers: {
        Row: {
          code: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          id: string;
          name: string;
          status: CarrierStatus;
          updated_at: string;
        };
        Insert: {
          code?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          status?: CarrierStatus;
          updated_at?: string;
        };
        Update: {
          code?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          status?: CarrierStatus;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          carrier_id: string;
          company_id: string;
          created_at: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          name: string | null;
          sla: Json | null;
          terms: string | null;
          updated_at: string;
        };
        Insert: {
          carrier_id: string;
          company_id: string;
          created_at?: string;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          name?: string | null;
          sla?: Json | null;
          terms?: string | null;
          updated_at?: string;
        };
        Update: {
          carrier_id?: string;
          company_id?: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          name?: string | null;
          sla?: Json | null;
          terms?: string | null;
          updated_at?: string;
        };
      };
      rates: {
        Row: {
          carrier_id: string;
          contract_id: string | null;
          created_at: string;
          currency: string;
          dest_zone: string | null;
          effective_from: string;
          effective_to: string | null;
          id: string;
          origin_zone: string | null;
          rate_amount: number;
          updated_at: string;
          weight_kg_max: number | null;
          weight_kg_min: number | null;
        };
        Insert: {
          carrier_id: string;
          contract_id?: string | null;
          created_at?: string;
          currency?: string;
          dest_zone?: string | null;
          effective_from: string;
          effective_to?: string | null;
          id?: string;
          origin_zone?: string | null;
          rate_amount: number;
          updated_at?: string;
          weight_kg_max?: number | null;
          weight_kg_min?: number | null;
        };
        Update: {
          carrier_id?: string;
          contract_id?: string | null;
          created_at?: string;
          currency?: string;
          dest_zone?: string | null;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          origin_zone?: string | null;
          rate_amount?: number;
          updated_at?: string;
          weight_kg_max?: number | null;
          weight_kg_min?: number | null;
        };
      };
      shipments: {
        Row: {
          carrier_id: string;
          company_id: string;
          created_at: string;
          delivered_at: string | null;
          dest_facility_id: string | null;
          id: string;
          origin_facility_id: string | null;
          shipped_at: string | null;
          status: ShipmentStatus;
          tracking_number: string;
          updated_at: string;
        };
        Insert: {
          carrier_id: string;
          company_id: string;
          created_at?: string;
          delivered_at?: string | null;
          dest_facility_id?: string | null;
          id?: string;
          origin_facility_id?: string | null;
          shipped_at?: string | null;
          status?: ShipmentStatus;
          tracking_number: string;
          updated_at?: string;
        };
        Update: {
          carrier_id?: string;
          company_id?: string;
          created_at?: string;
          delivered_at?: string | null;
          dest_facility_id?: string | null;
          id?: string;
          origin_facility_id?: string | null;
          shipped_at?: string | null;
          status?: ShipmentStatus;
          tracking_number?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          amount: number;
          approval_status: ApprovalStatus | null;
          carrier_id: string;
          company_id: string;
          created_at: string;
          currency: string;
          due_date: string | null;
          id: string;
          invoice_number: string;
          line_items: Json | null;
          shipment_id: string | null;
          status: InvoiceStatus;
          updated_at: string;
        };
        Insert: {
          amount: number;
          approval_status?: ApprovalStatus | null;
          carrier_id: string;
          company_id: string;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          id?: string;
          invoice_number: string;
          line_items?: Json | null;
          shipment_id?: string | null;
          status?: InvoiceStatus;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          approval_status?: ApprovalStatus | null;
          carrier_id?: string;
          company_id?: string;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          id?: string;
          invoice_number?: string;
          line_items?: Json | null;
          shipment_id?: string | null;
          status?: InvoiceStatus;
          updated_at?: string;
        };
      };
      alert_rules: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          type: AlertRuleType;
          threshold: number;
          condition: Json;
          channels: string[];
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          name: string;
          type: AlertRuleType;
          threshold: number;
          condition?: Json;
          channels?: string[];
          enabled?: boolean;
        };
        Update: {
          name?: string;
          type?: AlertRuleType;
          threshold?: number;
          condition?: Json;
          channels?: string[];
          enabled?: boolean;
        };
      };
      budgets: {
        Row: {
          id: string;
          company_id: string;
          fiscal_year: number;
          total_budget: number;
          budget_by_carrier: Json | null;
          budget_by_lane: Json | null;
          scenario_assumptions: Json | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          fiscal_year: number;
          total_budget: number;
          budget_by_carrier?: Json | null;
          budget_by_lane?: Json | null;
          scenario_assumptions?: Json | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_budget?: number;
          budget_by_carrier?: Json | null;
          budget_by_lane?: Json | null;
          scenario_assumptions?: Json | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      forecasts: {
        Row: {
          id: string;
          company_id: string;
          budget_id: string | null;
          algorithm: string;
          forecast_period: string;
          months: number;
          start_year: number | null;
          start_month: number | null;
          forecast_data: Json;
          scenario_data: Json | null;
          accuracy_score: number;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          budget_id?: string | null;
          algorithm: string;
          forecast_period: string;
          months: number;
          start_year?: number | null;
          start_month?: number | null;
          forecast_data: Json;
          scenario_data?: Json | null;
          accuracy_score?: number;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          updated_at?: string;
        };
      };
      budget_vs_actual: {
        Row: {
          id: string;
          company_id: string;
          budget_id: string | null;
          fiscal_year: number;
          fiscal_month: number;
          budget_amount: number;
          actual_amount: number;
          variance: number | null;
          variance_percent: number | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          budget_id?: string | null;
          fiscal_year: number;
          fiscal_month: number;
          budget_amount: number;
          actual_amount: number;
          variance?: number | null;
          variance_percent?: number | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          budget_amount?: number;
          actual_amount?: number;
          variance?: number | null;
          variance_percent?: number | null;
          updated_at?: string;
        };
      };
      optimization_recommendations: {
        Row: {
          id: string;
          company_id: string;
          recommendation_type: string;
          title: string;
          summary: string | null;
          carrier_id: string | null;
          lane_key: string | null;
          feasibility: string;
          impact_score: number;
          estimated_savings: number;
          savings_percent: number;
          supporting_data: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          recommendation_type: string;
          title: string;
          summary?: string | null;
          carrier_id?: string | null;
          lane_key?: string | null;
          feasibility?: string;
          impact_score?: number;
          estimated_savings?: number;
          savings_percent?: number;
          supporting_data?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string | null;
          feasibility?: string;
          impact_score?: number;
          updated_at?: string;
        };
      };
      budget_plans: {
        Row: {
          id: string;
          company_id: string;
          budget_id: string | null;
          fiscal_month: number;
          monthly_budget: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          budget_id?: string | null;
          fiscal_month: number;
          monthly_budget: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          monthly_budget?: number;
          updated_at?: string;
        };
      };
      carrier_metrics: {
        Row: {
          id: string;
          company_id: string;
          carrier_id: string;
          period_end: string | null;
          on_time_rate: number | null;
          score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          carrier_id: string;
          period_end?: string | null;
          on_time_rate?: number | null;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          on_time_rate?: number | null;
          score?: number | null;
          updated_at?: string;
        };
      };
    };
  };
}
