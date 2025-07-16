-- Create a sample property for demo purposes
-- Date: 2025-07-16

-- Function to create a demo property for a user
CREATE OR REPLACE FUNCTION public.create_demo_property(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
    property_id UUID;
BEGIN
    -- Generate a new UUID for the property
    property_id := gen_random_uuid();
    
    -- Insert the demo property
    INSERT INTO public.properties (
        id,
        user_id,
        name,
        address,
        type,
        year_built,
        square_feet,
        value,
        insurability_score,
        details,
        created_at,
        updated_at
    ) VALUES (
        property_id,
        user_uuid,
        'Main Residence',
        '{"street": "1234 Main Street, Austin, TX 78701"}',
        'Single Family Home',
        2010,
        2800,
        450000.00,
        92,
        '{"bedrooms": 4, "bathrooms": 3, "lot_size": 0.25}',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_demo_property(UUID) TO authenticated;