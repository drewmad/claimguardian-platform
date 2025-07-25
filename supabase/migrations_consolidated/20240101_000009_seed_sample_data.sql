-- Seed sample data for development and testing
-- Only runs in non-production environments

-- Check if we should run seed data (only in development)
DO $$
BEGIN
  -- Only seed if no properties exist
  IF NOT EXISTS (SELECT 1 FROM public.properties LIMIT 1) THEN
    
    -- Create test user (this would normally be created via auth)
    -- Using a predictable UUID for testing
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES ('d7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47', 'test@example.com', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Create user profile
    INSERT INTO public.user_profiles (
      id, email, display_name, phone_number, 
      address, city, state, zip_code, 
      profile_completed, onboarding_completed
    )
    VALUES (
      'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
      'test@example.com',
      'Test User',
      '555-123-4567',
      '123 Main St',
      'Naples',
      'FL',
      '34102',
      true,
      true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create sample property
    INSERT INTO public.properties (
      id, user_id, nickname, address, city, state, zip_code,
      property_type, year_built, square_footage, bedrooms, bathrooms,
      roof_type, roof_age_years, purchase_date, purchase_price
    )
    VALUES (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
      'Main Residence',
      '456 Oak Street',
      'Naples',
      'FL',
      '34102',
      'Single Family',
      2005,
      2500,
      4,
      3,
      'Tile',
      5,
      '2020-01-15',
      450000
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create sample insurance policy
    INSERT INTO public.insurance_policies (
      user_id, property_id, policy_number, policy_type,
      carrier_name, carrier_phone, effective_date, expiration_date,
      annual_premium, deductible, coverage_limit
    )
    VALUES (
      'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'HO-123456789',
      'homeowners',
      'Sample Insurance Co',
      '800-555-1234',
      CURRENT_DATE - INTERVAL '6 months',
      CURRENT_DATE + INTERVAL '6 months',
      2400.00,
      5000.00,
      500000.00
    )
    ON CONFLICT (policy_number, carrier_name) DO NOTHING;
    
    -- Create sample inventory items
    INSERT INTO public.inventory_items (
      user_id, property_id, name, description, category,
      brand, purchase_price, current_value, location_in_home
    )
    VALUES 
      (
        'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '65" Smart TV',
        '4K OLED Smart TV',
        'electronics',
        'Samsung',
        2000.00,
        1500.00,
        'Living Room'
      ),
      (
        'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'Leather Sofa',
        '3-seat leather sofa',
        'furniture',
        'Ashley',
        1200.00,
        800.00,
        'Living Room'
      ),
      (
        'd7a5fb5e-b3b7-4c38-8b70-4a3c0b6f9e47',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'Refrigerator',
        'French door refrigerator with ice maker',
        'appliances',
        'LG',
        1800.00,
        1200.00,
        'Kitchen'
      );
    
    RAISE NOTICE 'Sample data created successfully';
  ELSE
    RAISE NOTICE 'Data already exists, skipping seed';
  END IF;
END $$;