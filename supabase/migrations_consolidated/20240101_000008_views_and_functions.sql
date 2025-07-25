-- Helper views and utility functions
-- Provides convenient access patterns and data aggregations

-- Claims overview view
CREATE OR REPLACE VIEW public.claims_overview AS
SELECT 
  c.id,
  c.user_id,
  c.property_id,
  c.claim_number,
  c.status,
  c.damage_type,
  c.damage_date,
  c.estimated_loss,
  c.settlement_amount,
  p.address as property_address,
  p.city as property_city,
  p.state as property_state,
  p.zip_code as property_zip,
  pol.carrier_name,
  pol.policy_number,
  pol.policy_type,
  COUNT(DISTINCT pd.id) as document_count,
  c.created_at,
  c.updated_at
FROM public.insurance_claims c
JOIN public.properties p ON c.property_id = p.id
LEFT JOIN public.insurance_policies pol ON c.policy_id = pol.id
LEFT JOIN public.policy_documents pd ON pd.claim_id = c.id
GROUP BY 
  c.id, c.user_id, c.property_id, c.claim_number, c.status,
  c.damage_type, c.damage_date, c.estimated_loss, c.settlement_amount,
  p.address, p.city, p.state, p.zip_code,
  pol.carrier_name, pol.policy_number, pol.policy_type,
  c.created_at, c.updated_at;

-- User dashboard stats view
CREATE OR REPLACE VIEW public.user_dashboard_stats AS
SELECT 
  up.id as user_id,
  up.email,
  up.display_name,
  COUNT(DISTINCT p.id) as property_count,
  COUNT(DISTINCT ic.id) as total_claims,
  COUNT(DISTINCT CASE WHEN ic.status NOT IN ('closed', 'denied') THEN ic.id END) as active_claims,
  COUNT(DISTINCT ip.id) as policy_count,
  COALESCE(SUM(ic.estimated_loss), 0) as total_estimated_loss,
  COALESCE(SUM(ic.settlement_amount), 0) as total_settlements,
  COUNT(DISTINCT ii.id) as inventory_items,
  up.created_at as member_since
FROM public.user_profiles up
LEFT JOIN public.properties p ON up.id = p.user_id
LEFT JOIN public.insurance_claims ic ON p.id = ic.property_id
LEFT JOIN public.insurance_policies ip ON p.id = ip.property_id AND ip.is_active = true
LEFT JOIN public.inventory_items ii ON p.id = ii.property_id AND ii.is_deleted = false
GROUP BY up.id, up.email, up.display_name, up.created_at;

-- Property value tracking view
CREATE OR REPLACE VIEW public.property_values AS
SELECT 
  p.id,
  p.user_id,
  p.address,
  p.city,
  p.state,
  p.zip_code,
  p.purchase_price,
  p.purchase_date,
  p.current_value,
  ep.total_value as tax_assessed_value,
  ep.sale_price as last_sale_price,
  ep.sale_date as last_sale_date,
  CASE 
    WHEN p.current_value IS NOT NULL THEN p.current_value
    WHEN ep.total_value IS NOT NULL THEN ep.total_value
    ELSE p.purchase_price
  END as best_value_estimate
FROM public.properties p
LEFT JOIN external_florida.parcels ep ON p.parcel_number = ep.parcel_id;

-- Utility function to format currency
CREATE OR REPLACE FUNCTION public.format_currency(amount NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN '$' || TO_CHAR(amount, 'FM999,999,999.00');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate claim completion percentage
CREATE OR REPLACE FUNCTION public.calculate_claim_completion(claim_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completion INTEGER := 0;
  v_claim RECORD;
  v_doc_count INTEGER;
BEGIN
  -- Get claim details
  SELECT * INTO v_claim
  FROM public.insurance_claims
  WHERE id = claim_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic info (20%)
  IF v_claim.damage_description IS NOT NULL THEN
    v_completion := v_completion + 20;
  END IF;
  
  -- Claim submitted (20%)
  IF v_claim.status != 'draft' THEN
    v_completion := v_completion + 20;
  END IF;
  
  -- Has documents (20%)
  SELECT COUNT(*) INTO v_doc_count
  FROM public.policy_documents
  WHERE claim_id = claim_id;
  
  IF v_doc_count > 0 THEN
    v_completion := v_completion + 20;
  END IF;
  
  -- Has estimate (20%)
  IF v_claim.estimated_loss IS NOT NULL THEN
    v_completion := v_completion + 20;
  END IF;
  
  -- Has adjuster info (20%)
  IF v_claim.adjuster_name IS NOT NULL THEN
    v_completion := v_completion + 20;
  END IF;
  
  RETURN LEAST(v_completion, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get property risk assessment
CREATE OR REPLACE FUNCTION public.assess_property_risk(property_id UUID)
RETURNS TABLE (
  risk_level TEXT,
  risk_factors JSONB,
  recommendations JSONB
) AS $$
DECLARE
  v_property RECORD;
  v_risk_factors JSONB := '[]'::JSONB;
  v_recommendations JSONB := '[]'::JSONB;
  v_risk_score INTEGER := 0;
  v_risk_level TEXT;
BEGIN
  -- Get property details
  SELECT * INTO v_property
  FROM public.properties
  WHERE id = property_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Check roof age
  IF v_property.roof_age_years > 15 THEN
    v_risk_score := v_risk_score + 20;
    v_risk_factors := v_risk_factors || '["Roof age over 15 years"]'::JSONB;
    v_recommendations := v_recommendations || '["Consider roof inspection and potential replacement"]'::JSONB;
  END IF;
  
  -- Check property age
  IF v_property.year_built < 1980 THEN
    v_risk_score := v_risk_score + 15;
    v_risk_factors := v_risk_factors || '["Property built before 1980"]'::JSONB;
    v_recommendations := v_recommendations || '["Update electrical and plumbing systems"]'::JSONB;
  END IF;
  
  -- Check for pool
  IF v_property.has_pool THEN
    v_risk_score := v_risk_score + 10;
    v_risk_factors := v_risk_factors || '["Property has pool"]'::JSONB;
    v_recommendations := v_recommendations || '["Ensure pool safety features are up to code"]'::JSONB;
  END IF;
  
  -- Determine risk level
  v_risk_level := CASE
    WHEN v_risk_score >= 40 THEN 'High'
    WHEN v_risk_score >= 20 THEN 'Medium'
    ELSE 'Low'
  END;
  
  RETURN QUERY SELECT v_risk_level, v_risk_factors, v_recommendations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to views
GRANT SELECT ON public.claims_overview TO authenticated;
GRANT SELECT ON public.user_dashboard_stats TO authenticated;
GRANT SELECT ON public.property_values TO authenticated;

-- Add RLS to views
ALTER VIEW public.claims_overview OWNER TO postgres;
ALTER VIEW public.user_dashboard_stats OWNER TO postgres;
ALTER VIEW public.property_values OWNER TO postgres;