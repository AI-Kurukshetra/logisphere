-- Sample operational data for the existing Logisphere workspace.
-- This script is idempotent: it uses fixed UUIDs and ON CONFLICT DO NOTHING.

DO $$
DECLARE
  target_company_id constant uuid := 'c1ad34df-a216-460d-a01a-187ddbf9b12e';
  target_profile_id constant uuid := '1ab813e9-ed09-491f-a014-0944d297e63a';
  target_region_id constant uuid := 'b77c86a2-3aa0-49c9-81df-637dcfe6bfa0';
  target_business_unit_id constant uuid := 'd92a984b-32b1-421a-9988-6fcd05010d91';
  primary_facility_id constant uuid := '407576dd-4cf0-4871-85ca-c8430169e4f3';
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = target_company_id
  ) THEN
    RAISE EXCEPTION 'Seed company % was not found.', target_company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = target_profile_id
  ) THEN
    RAISE EXCEPTION 'Seed profile % was not found.', target_profile_id;
  END IF;

  INSERT INTO public.regions (id, company_id, name, code, description)
  VALUES
    ('a1000000-0000-4000-8000-000000000001', target_company_id, 'North America Ops', 'NA-OPS', 'Seed region for dashboards and reporting'),
    ('a1000000-0000-4000-8000-000000000002', target_company_id, 'Europe Lane Control', 'EU-LC', 'Seed region for cross-border scenarios')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.business_units (id, company_id, region_id, name, code, description)
  VALUES
    ('b1000000-0000-4000-8000-000000000001', target_company_id, target_region_id, 'Freight Audit Desk', 'FAD', 'Handles invoice validation and dispute workflows'),
    ('b1000000-0000-4000-8000-000000000002', target_company_id, target_region_id, 'Carrier Performance Office', 'CPO', 'Owns carrier scorecards and SLA monitoring')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.facilities (
    id,
    company_id,
    region_id,
    business_unit_id,
    name,
    code,
    type,
    status,
    contact_name,
    contact_email,
    address
  )
  VALUES
    (
      'c1000000-0000-4000-8000-000000000001',
      target_company_id,
      target_region_id,
      target_business_unit_id,
      'Los Angeles Crossdock',
      'LAX-XD',
      'crossdock',
      'active',
      'Maria Chen',
      'la-ops@example.com',
      '{"line1":"2400 Harbor Blvd","city":"Los Angeles","state":"CA","postal_code":"90731","country":"US"}'::jsonb
    ),
    (
      'c1000000-0000-4000-8000-000000000002',
      target_company_id,
      target_region_id,
      target_business_unit_id,
      'Chicago Sort Center',
      'CHI-SC',
      'sort_center',
      'active',
      'Daniel Ortiz',
      'chicago-ops@example.com',
      '{"line1":"1800 Logistics Pkwy","city":"Chicago","state":"IL","postal_code":"60638","country":"US"}'::jsonb
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.carriers (id, name, code, contact_email, contact_phone, status)
  VALUES
    ('d1000000-0000-4000-8000-000000000001', 'Atlas Freight', 'ATLAS', 'ops@atlasfreight.example', '+1-312-555-0101', 'active'),
    ('d1000000-0000-4000-8000-000000000002', 'BlueLine Logistics', 'BLUELINE', 'support@blueline.example', '+1-404-555-0110', 'active'),
    ('d1000000-0000-4000-8000-000000000003', 'NorthStar Parcel', 'NSTAR', 'care@northstar.example', '+1-206-555-0199', 'inactive')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.contracts (
    id,
    company_id,
    carrier_id,
    name,
    terms,
    sla,
    effective_from,
    effective_to
  )
  VALUES
    (
      'e1000000-0000-4000-8000-000000000001',
      target_company_id,
      'd1000000-0000-4000-8000-000000000001',
      'Atlas 2026 National Agreement',
      'Net 30 billing with quarterly performance review.',
      '{"on_time_target":98,"billing_accuracy_target":99.5,"damage_rate_max":1.2}'::jsonb,
      DATE '2026-01-01',
      DATE '2026-12-31'
    ),
    (
      'e1000000-0000-4000-8000-000000000002',
      target_company_id,
      'd1000000-0000-4000-8000-000000000002',
      'BlueLine Regional Contract',
      'Priority network pricing for Midwest and West lanes.',
      '{"on_time_target":97,"billing_accuracy_target":99.0,"damage_rate_max":1.8}'::jsonb,
      DATE '2026-02-01',
      DATE '2026-12-31'
    ),
    (
      'e1000000-0000-4000-8000-000000000003',
      target_company_id,
      'd1000000-0000-4000-8000-000000000003',
      'NorthStar Overflow Agreement',
      'Overflow parcel capacity during peak months.',
      '{"on_time_target":95,"billing_accuracy_target":98.0,"damage_rate_max":2.2}'::jsonb,
      DATE '2026-03-01',
      DATE '2026-09-30'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.rates (
    id,
    carrier_id,
    contract_id,
    origin_zone,
    dest_zone,
    weight_kg_min,
    weight_kg_max,
    rate_amount,
    currency,
    effective_from,
    effective_to
  )
  VALUES
    ('f1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'WEST', 'MIDWEST', 0, 10, 42.50, 'USD', DATE '2026-01-01', DATE '2026-12-31'),
    ('f1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'WEST', 'SOUTH', 10, 25, 68.25, 'USD', DATE '2026-01-01', DATE '2026-12-31'),
    ('f1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'MIDWEST', 'WEST', 0, 10, 44.10, 'USD', DATE '2026-02-01', DATE '2026-12-31'),
    ('f1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002', 'MIDWEST', 'NORTHEAST', 10, 25, 71.90, 'USD', DATE '2026-02-01', DATE '2026-12-31'),
    ('f1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003', 'WEST', 'NORTHEAST', 0, 8, 47.75, 'USD', DATE '2026-03-01', DATE '2026-09-30')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.shipments (
    id,
    company_id,
    carrier_id,
    tracking_number,
    origin_facility_id,
    dest_facility_id,
    status,
    shipped_at,
    delivered_at,
    created_at
  )
  VALUES
    ('11000000-0000-4000-8000-000000000001', target_company_id, 'd1000000-0000-4000-8000-000000000001', 'LGS-SEED-1001', primary_facility_id, 'c1000000-0000-4000-8000-000000000001', 'delivered', now() - interval '6 days', now() - interval '3 days', now() - interval '7 days'),
    ('11000000-0000-4000-8000-000000000002', target_company_id, 'd1000000-0000-4000-8000-000000000002', 'LGS-SEED-1002', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'in_transit', now() - interval '2 days', null, now() - interval '3 days'),
    ('11000000-0000-4000-8000-000000000003', target_company_id, 'd1000000-0000-4000-8000-000000000003', 'LGS-SEED-1003', primary_facility_id, 'c1000000-0000-4000-8000-000000000002', 'exception', now() - interval '1 day', null, now() - interval '2 days'),
    ('11000000-0000-4000-8000-000000000004', target_company_id, 'd1000000-0000-4000-8000-000000000001', 'LGS-SEED-1004', 'c1000000-0000-4000-8000-000000000002', primary_facility_id, 'out_for_delivery', now() - interval '10 hours', null, now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tracking_events (
    id,
    company_id,
    shipment_id,
    status,
    description,
    location,
    event_at,
    created_by
  )
  VALUES
    ('12000000-0000-4000-8000-000000000001', target_company_id, '11000000-0000-4000-8000-000000000001', 'picked_up', 'Picked up from origin dock.', '{"city":"Austin","state":"TX","country":"US"}'::jsonb, now() - interval '6 days', target_profile_id),
    ('12000000-0000-4000-8000-000000000002', target_company_id, '11000000-0000-4000-8000-000000000001', 'delivered', 'Delivered and signed by receiving team.', '{"city":"Los Angeles","state":"CA","country":"US"}'::jsonb, now() - interval '3 days', target_profile_id),
    ('12000000-0000-4000-8000-000000000003', target_company_id, '11000000-0000-4000-8000-000000000002', 'picked_up', 'Trailer departed the crossdock.', '{"city":"Los Angeles","state":"CA","country":"US"}'::jsonb, now() - interval '2 days', target_profile_id),
    ('12000000-0000-4000-8000-000000000004', target_company_id, '11000000-0000-4000-8000-000000000002', 'in_transit', 'Reached regional sort hub.', '{"city":"Denver","state":"CO","country":"US"}'::jsonb, now() - interval '12 hours', target_profile_id),
    ('12000000-0000-4000-8000-000000000005', target_company_id, '11000000-0000-4000-8000-000000000003', 'exception', 'Delivery delayed due to weather hold.', '{"city":"Kansas City","state":"MO","country":"US"}'::jsonb, now() - interval '8 hours', target_profile_id),
    ('12000000-0000-4000-8000-000000000006', target_company_id, '11000000-0000-4000-8000-000000000004', 'out_for_delivery', 'Courier is on final-mile route.', '{"city":"Austin","state":"TX","country":"US"}'::jsonb, now() - interval '2 hours', target_profile_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.invoices (
    id,
    company_id,
    carrier_id,
    shipment_id,
    invoice_number,
    amount,
    currency,
    status,
    approval_status,
    line_items,
    due_date,
    created_at
  )
  VALUES
    (
      '13000000-0000-4000-8000-000000000001',
      target_company_id,
      'd1000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000001',
      'INV-SEED-1001',
      42.50,
      'USD',
      'paid',
      'approved',
      '[{"code":"linehaul","description":"West to Midwest lane","amount":38.00},{"code":"fuel","description":"Fuel surcharge","amount":4.50}]'::jsonb,
      current_date - 1,
      now() - interval '5 days'
    ),
    (
      '13000000-0000-4000-8000-000000000002',
      target_company_id,
      'd1000000-0000-4000-8000-000000000002',
      '11000000-0000-4000-8000-000000000002',
      'INV-SEED-1002',
      71.90,
      'USD',
      'approved',
      'approved',
      '[{"code":"transport","description":"Midwest to Northeast lane","amount":65.00},{"code":"accessorial","description":"Sort surcharge","amount":6.90}]'::jsonb,
      current_date + 7,
      now() - interval '2 days'
    ),
    (
      '13000000-0000-4000-8000-000000000003',
      target_company_id,
      'd1000000-0000-4000-8000-000000000003',
      '11000000-0000-4000-8000-000000000003',
      'INV-SEED-1003',
      88.40,
      'USD',
      'exception',
      'pending_approval',
      '[{"code":"parcel","description":"Overflow parcel capacity","amount":76.00},{"code":"peak","description":"Peak season premium","amount":12.40}]'::jsonb,
      current_date + 10,
      now() - interval '1 day'
    ),
    (
      '13000000-0000-4000-8000-000000000004',
      target_company_id,
      'd1000000-0000-4000-8000-000000000001',
      '11000000-0000-4000-8000-000000000004',
      'INV-SEED-1004',
      54.80,
      'USD',
      'disputed',
      'rejected',
      '[{"code":"linehaul","description":"Return lane charge","amount":49.00},{"code":"accessorial","description":"Residential surcharge","amount":5.80}]'::jsonb,
      current_date + 14,
      now() - interval '12 hours'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.audits (
    id,
    invoice_id,
    rule_name,
    result,
    variance_amount,
    details,
    created_at
  )
  VALUES
    ('14000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 'rate_card_match', 'pass', 0, '{"matched_contract":"Atlas 2026 National Agreement"}'::jsonb, now() - interval '4 days'),
    ('14000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000002', 'fuel_surcharge_band', 'pass', 0, '{"band":"standard"}'::jsonb, now() - interval '1 day'),
    ('14000000-0000-4000-8000-000000000003', '13000000-0000-4000-8000-000000000003', 'peak_surcharge_check', 'flag', 8.4, '{"expected_amount":80.0,"detected_amount":88.4}'::jsonb, now() - interval '18 hours'),
    ('14000000-0000-4000-8000-000000000004', '13000000-0000-4000-8000-000000000004', 'accessorial_validation', 'flag', 5.8, '{"reason":"Residential surcharge not present in contract"}'::jsonb, now() - interval '6 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.payments (
    id,
    invoice_id,
    amount,
    currency,
    status,
    paid_at,
    method,
    reference,
    created_at
  )
  VALUES
    ('15000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000001', 42.50, 'USD', 'completed', now() - interval '1 day', 'ACH', 'PAY-SEED-1001', now() - interval '1 day'),
    ('15000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000002', 71.90, 'USD', 'pending', null, 'Wire', 'PAY-SEED-1002', now() - interval '12 hours'),
    ('15000000-0000-4000-8000-000000000003', '13000000-0000-4000-8000-000000000004', 54.80, 'USD', 'failed', null, 'Card', 'PAY-SEED-1004', now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.performance_metrics (
    id,
    company_id,
    carrier_id,
    period_start,
    period_end,
    on_time_rate,
    damage_rate,
    billing_accuracy,
    score,
    created_at
  )
  VALUES
    ('16000000-0000-4000-8000-000000000001', target_company_id, 'd1000000-0000-4000-8000-000000000001', DATE '2026-03-01', DATE '2026-03-31', 98.2, 0.4, 99.1, 96.8, now() - interval '2 hours'),
    ('16000000-0000-4000-8000-000000000002', target_company_id, 'd1000000-0000-4000-8000-000000000002', DATE '2026-03-01', DATE '2026-03-31', 95.6, 0.8, 98.4, 93.9, now() - interval '2 hours'),
    ('16000000-0000-4000-8000-000000000003', target_company_id, 'd1000000-0000-4000-8000-000000000003', DATE '2026-03-01', DATE '2026-03-31', 89.4, 2.1, 94.2, 87.1, now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.alerts (
    id,
    company_id,
    type,
    title,
    message,
    read,
    metadata,
    created_at
  )
  VALUES
    ('17000000-0000-4000-8000-000000000001', target_company_id, 'shipment_exception', 'Weather delay on LGS-SEED-1003', 'A Midwest weather hold has pushed the ETA by 18 hours.', false, '{"shipment_id":"11000000-0000-4000-8000-000000000003","severity":"high"}'::jsonb, now() - interval '7 hours'),
    ('17000000-0000-4000-8000-000000000002', target_company_id, 'invoice_dispute', 'Invoice INV-SEED-1004 needs review', 'Audit flagged an unsupported residential surcharge.', false, '{"invoice_id":"13000000-0000-4000-8000-000000000004","severity":"critical"}'::jsonb, now() - interval '5 hours'),
    ('17000000-0000-4000-8000-000000000003', target_company_id, 'payment_status', 'Payment queue has 1 pending approval', 'BlueLine invoice is approved but still awaiting disbursement.', true, '{"payment_id":"15000000-0000-4000-8000-000000000002"}'::jsonb, now() - interval '3 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.reports (
    id,
    company_id,
    name,
    type,
    params,
    created_by,
    created_at
  )
  VALUES
    ('18000000-0000-4000-8000-000000000001', target_company_id, 'March Carrier Scorecard', 'carrier_performance', '{"period":"2026-03","group_by":"carrier"}'::jsonb, target_profile_id, now() - interval '2 days'),
    ('18000000-0000-4000-8000-000000000002', target_company_id, 'Open Exceptions Snapshot', 'exceptions', '{"status":["exception","disputed"],"window":"30d"}'::jsonb, target_profile_id, now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.invoice_disputes (
    id,
    invoice_id,
    status,
    notes,
    resolved_at,
    created_at
  )
  VALUES
    ('19000000-0000-4000-8000-000000000001', '13000000-0000-4000-8000-000000000003', 'open', 'Peak surcharge exceeds contract cap by 8.40 USD.', null, now() - interval '16 hours'),
    ('19000000-0000-4000-8000-000000000002', '13000000-0000-4000-8000-000000000004', 'resolved', 'Carrier acknowledged unsupported accessorial and issued credit memo.', now() - interval '1 hour', now() - interval '8 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.documents (
    id,
    company_id,
    title,
    document_type,
    storage_path,
    entity_type,
    entity_id,
    metadata,
    uploaded_by,
    created_at
  )
  VALUES
    ('1a000000-0000-4000-8000-000000000001', target_company_id, 'Atlas Rate Card Q1', 'rate_card', 'seed/contracts/atlas-rate-card-q1.pdf', 'contract', 'e1000000-0000-4000-8000-000000000001', '{"carrier":"Atlas Freight","version":"Q1-2026"}'::jsonb, target_profile_id, now() - interval '4 days'),
    ('1a000000-0000-4000-8000-000000000002', target_company_id, 'Exception Photo Pack', 'shipment_attachment', 'seed/shipments/lgs-seed-1003/photos.zip', 'shipment', '11000000-0000-4000-8000-000000000003', '{"shipment":"LGS-SEED-1003","file_count":4}'::jsonb, target_profile_id, now() - interval '10 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.import_jobs (
    id,
    company_id,
    entity_type,
    source_name,
    file_name,
    status,
    row_count,
    processed_count,
    errors,
    created_by,
    created_at
  )
  VALUES
    ('1b000000-0000-4000-8000-000000000001', target_company_id, 'shipments', 'sftp_feed', 'shipments_march_2026.csv', 'completed', 248, 248, '[]'::jsonb, target_profile_id, now() - interval '3 days'),
    ('1b000000-0000-4000-8000-000000000002', target_company_id, 'invoices', 'carrier_portal', 'atlas_week11.xlsx', 'completed', 36, 34, '[{"row":17,"message":"Missing due_date"},{"row":29,"message":"Unknown tracking number"}]'::jsonb, target_profile_id, now() - interval '20 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.export_jobs (
    id,
    company_id,
    entity_type,
    format,
    status,
    file_name,
    params,
    created_by,
    created_at
  )
  VALUES
    ('1c000000-0000-4000-8000-000000000001', target_company_id, 'reports', 'csv', 'completed', 'carrier_scorecard_march.csv', '{"report_id":"18000000-0000-4000-8000-000000000001"}'::jsonb, target_profile_id, now() - interval '1 day'),
    ('1c000000-0000-4000-8000-000000000002', target_company_id, 'invoices', 'xlsx', 'pending', 'open_disputes.xlsx', '{"status":["exception","disputed"]}'::jsonb, target_profile_id, now() - interval '2 hours')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.integrations (
    id,
    company_id,
    name,
    system_type,
    mode,
    status,
    endpoint_url,
    auth_type,
    config,
    last_sync_at,
    created_by,
    created_at
  )
  VALUES
    (
      '1e000000-0000-4000-8000-000000000001',
      target_company_id,
      'NetSuite Finance Sync',
      'erp',
      'hybrid',
      'healthy',
      'https://erp.example.com/webhooks/logisphere',
      'oauth',
      '{"owner":"finance-ops","sync_window":"hourly"}'::jsonb,
      now() - interval '45 minutes',
      target_profile_id,
      now() - interval '3 days'
    ),
    (
      '1e000000-0000-4000-8000-000000000002',
      target_company_id,
      'Carrier Event Bridge',
      'carrier_api',
      'webhook',
      'degraded',
      'https://carrier.example.com/events',
      'api_key',
      '{"owner":"carrier-tech","retry_policy":"exponential"}'::jsonb,
      now() - interval '2 hours',
      target_profile_id,
      now() - interval '1 day'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.webhook_events (
    id,
    company_id,
    integration_id,
    direction,
    event_type,
    status,
    headers,
    payload,
    error_message,
    received_at,
    processed_at,
    created_at
  )
  VALUES
    (
      '1f000000-0000-4000-8000-000000000001',
      target_company_id,
      '1e000000-0000-4000-8000-000000000001',
      'outbound',
      'invoice.approved',
      'processed',
      '{"x-source":"logisphere"}'::jsonb,
      '{"invoice_id":"13000000-0000-4000-8000-000000000002","status":"approved"}'::jsonb,
      null,
      now() - interval '40 minutes',
      now() - interval '39 minutes',
      now() - interval '40 minutes'
    ),
    (
      '1f000000-0000-4000-8000-000000000002',
      target_company_id,
      '1e000000-0000-4000-8000-000000000002',
      'inbound',
      'shipment.exception',
      'failed',
      '{"x-carrier":"northstar"}'::jsonb,
      '{"tracking_number":"LGS-SEED-1003","status":"exception"}'::jsonb,
      'Remote endpoint timeout after 30 seconds.',
      now() - interval '90 minutes',
      null,
      now() - interval '90 minutes'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.activity_logs (
    id,
    company_id,
    actor_profile_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata,
    created_at
  )
  VALUES
    ('1d000000-0000-4000-8000-000000000001', target_company_id, target_profile_id, 'shipment.created', 'shipment', '11000000-0000-4000-8000-000000000002', 'Created a seeded in-transit shipment for dashboard validation.', '{"tracking_number":"LGS-SEED-1002"}'::jsonb, now() - interval '2 days'),
    ('1d000000-0000-4000-8000-000000000002', target_company_id, target_profile_id, 'invoice.flagged', 'invoice', '13000000-0000-4000-8000-000000000003', 'Flagged invoice due to peak surcharge variance.', '{"variance_amount":8.4}'::jsonb, now() - interval '16 hours'),
    ('1d000000-0000-4000-8000-000000000003', target_company_id, target_profile_id, 'payment.failed', 'payment', '15000000-0000-4000-8000-000000000003', 'Payment attempt failed for disputed invoice.', '{"reference":"PAY-SEED-1004"}'::jsonb, now() - interval '2 hours'),
    ('1d000000-0000-4000-8000-000000000004', target_company_id, target_profile_id, 'report.generated', 'report', '18000000-0000-4000-8000-000000000002', 'Generated exception snapshot for the previous 30 days.', '{"format":"json"}'::jsonb, now() - interval '1 hour')
  ON CONFLICT (id) DO NOTHING;
END
$$;
