-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Profiles (simplified, assuming Supabase Auth handles core user table)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    member_since TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (7.2.1.4, 7.2.3.4, 7.2.4.4, 7.2.5.4, 7.2.6.4)
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address JSONB,
    type TEXT,
    year_built INTEGER,
    square_feet INTEGER,
    details JSONB, -- bedrooms, bathrooms, stories, pool, construction
    insurance_carrier TEXT,
    insurance_policy_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Property Items (Inventory) (7.2.3.4)
CREATE TABLE personal_property_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    basic_info JSONB, -- name, category, subcategory, brand, model, serial_number, custom_id
    identification JSONB, -- ai_detected_type, ai_confidence, barcode, unique_features
    financial JSONB, -- purchase_price, purchase_date, purchase_location, payment_method, current_value, value_last_updated, depreciation_rate, insurance_scheduled, scheduled_value
    physical JSONB, -- color, size, weight_lbs, material, condition
    location JSONB, -- room, specific_location, storage_type, flood_vulnerable
    documentation JSONB, -- photos, receipts, appraisals, manuals
    warranty JSONB, -- has_warranty, warranty_end, warranty_provider, extended_warranty
    metadata JSONB, -- created_at, updated_at, verified, verification_method, tags, notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Home Systems (7.2.4.4)
CREATE TABLE home_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    system_info JSONB, -- type, subtype, name, location, brand, model, serial_number, capacity
    installation JSONB, -- install_date, installer, cost, permit_number, permit_final_date
    specifications JSONB, -- hvac, water_heater, electrical, generator specific details
    maintenance JSONB, -- schedule, history
    insurance JSONB, -- four_point_ready, wind_mitigation_credit, age_years, expected_life_years, replacement_cost
    ai_analysis JSONB, -- failure_probability, efficiency_score, maintenance_score, recommendations
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structures (7.2.5.4)
CREATE TABLE structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    basic_info JSONB, -- type, name, year_built, square_feet, height_feet, construction_type
    location JSONB, -- position, setbacks, flood_zone, elevation_feet
    hurricane_features JSONB, -- roof, openings, connections
    permits JSONB, -- building_permit, specialty_permits
    insurance JSONB, -- scheduled, coverage_amount, wind_mitigation_credits, four_point_items
    condition JSONB, -- overall, issues
    pool_specific JSONB,
    marine_specific JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Land Details (7.2.6.4)
CREATE TABLE land_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    survey JSONB,
    topography JSONB,
    vegetation JSONB,
    drainage JSONB,
    easements JSONB,
    improvements JSONB,
    environmental JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Policies (7.2.2.4)
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    carrier JSONB,
    policy_details JSONB,
    coverage JSONB,
    florida_specific JSONB,
    premium JSONB,
    documents JSONB,
    analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Claims (7.2.7.4)
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES insurance_policies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    claim_details JSONB,
    damages JSONB,
    timeline JSONB,
    parties JSONB,
    financial JSONB,
    status JSONB,
    correspondence JSONB,
    compliance JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors (7.2.8.4)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_info JSONB,
    credentials JSONB,
    specialties JSONB,
    ratings JSONB,
    performance JSONB,
    pricing JSONB,
    availability JSONB,
    verification JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests (7.2.8.4)
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_info JSONB,
    matching JSONB,
    quotes JSONB,
    selection JSONB,
    completion JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community (7.2.10.4)
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT,
    boundaries JSONB,
    stats JSONB,
    leadership JSONB,
    settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    profile JSONB,
    contributions JSONB,
    reputation JSONB,
    preferences JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    type TEXT,
    author JSONB,
    content JSONB,
    verification JSONB,
    contractor_specific JSONB,
    weather_specific JSONB,
    impact JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_buys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    details JSONB,
    requirements JSONB,
    participants JSONB,
    status JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - Basic setup, will need refinement
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_property_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;

-- Policies for RLS (example - user_profiles, will need to be expanded for all tables)
CREATE POLICY "Users can view their own profiles" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profiles" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profiles" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for properties (example - users can view their own properties)
CREATE POLICY "Users can view their own properties" ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own properties" ON properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own properties" ON properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own properties" ON properties FOR DELETE USING (auth.uid() = user_id);

-- Policies for personal_property_items (example - users can view items of their properties)
CREATE POLICY "Users can view personal property items of their properties" ON personal_property_items FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = personal_property_items.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can insert personal property items into their properties" ON personal_property_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = personal_property_items.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can update personal property items of their properties" ON personal_property_items FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = personal_property_items.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can delete personal property items of their properties" ON personal_property_items FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = personal_property_items.property_id AND properties.user_id = auth.uid()));

-- Policies for home_systems
CREATE POLICY "Users can view home systems of their properties" ON home_systems FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = home_systems.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can insert home systems into their properties" ON home_systems FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = home_systems.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can update home systems of their properties" ON home_systems FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = home_systems.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can delete home systems of their properties" ON home_systems FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = home_systems.property_id AND properties.user_id = auth.uid()));

-- Policies for structures
CREATE POLICY "Users can view structures of their properties" ON structures FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = structures.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can insert structures into their properties" ON structures FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = structures.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can update structures of their properties" ON structures FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = structures.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can delete structures of their properties" ON structures FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = structures.property_id AND properties.user_id = auth.uid()));

-- Policies for land_details
CREATE POLICY "Users can view land details of their properties" ON land_details FOR SELECT USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = land_details.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can insert land details into their properties" ON land_details FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = land_details.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can update land details of their properties" ON land_details FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = land_details.property_id AND properties.user_id = auth.uid()));
CREATE POLICY "Users can delete land details of their properties" ON land_details FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = land_details.property_id AND properties.user_id = auth.uid()));

-- Policies for insurance_policies
CREATE POLICY "Users can view their own insurance policies" ON insurance_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own insurance policies" ON insurance_policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insurance policies" ON insurance_policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insurance policies" ON insurance_policies FOR DELETE USING (auth.uid() = user_id);

-- Policies for insurance_claims
CREATE POLICY "Users can view their own insurance claims" ON insurance_claims FOR SELECT USING (EXISTS (SELECT 1 FROM insurance_policies WHERE insurance_policies.id = insurance_claims.policy_id AND insurance_policies.user_id = auth.uid()));
CREATE POLICY "Users can insert their own insurance claims" ON insurance_claims FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM insurance_policies WHERE insurance_policies.id = insurance_claims.policy_id AND insurance_policies.user_id = auth.uid()));
CREATE POLICY "Users can update their own insurance claims" ON insurance_claims FOR UPDATE USING (EXISTS (SELECT 1 FROM insurance_policies WHERE insurance_policies.id = insurance_claims.policy_id AND insurance_policies.user_id = auth.uid()));
CREATE POLICY "Users can delete their own insurance claims" ON insurance_claims FOR DELETE USING (EXISTS (SELECT 1 FROM insurance_policies WHERE insurance_policies.id = insurance_claims.policy_id AND insurance_policies.user_id = auth.uid()));

-- Policies for vendors (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view vendors" ON vendors FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for service_requests
CREATE POLICY "Users can view their own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own service requests" ON service_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own service requests" ON service_requests FOR DELETE USING (auth.uid() = user_id);

-- Policies for neighborhoods (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view neighborhoods" ON neighborhoods FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for community_members
CREATE POLICY "Users can view community members of their neighborhoods" ON community_members FOR SELECT USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = community_members.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can insert themselves into neighborhoods" ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own community membership" ON community_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own community membership" ON community_members FOR DELETE USING (auth.uid() = user_id);

-- Policies for community_insights
CREATE POLICY "Users can view community insights of their neighborhoods" ON community_insights FOR SELECT USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = community_insights.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can insert community insights into their neighborhoods" ON community_insights FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = community_insights.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can update their own community insights" ON community_insights FOR UPDATE USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = community_insights.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can delete their own community insights" ON community_insights FOR DELETE USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = community_insights.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));

-- Policies for group_buys
CREATE POLICY "Users can view group buys of their neighborhoods" ON group_buys FOR SELECT USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = group_buys.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can insert group buys into their neighborhoods" ON group_buys FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = group_buys.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can update their own group buys" ON group_buys FOR UPDATE USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = group_buys.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
CREATE POLICY "Users can delete their own group buys" ON group_buys FOR DELETE USING (EXISTS (SELECT 1 FROM neighborhoods WHERE neighborhoods.id = group_buys.neighborhood_id AND EXISTS (SELECT 1 FROM community_members WHERE community_members.neighborhood_id = neighborhoods.id AND community_members.user_id = auth.uid())));
