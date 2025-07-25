-- Insert a sample property for testing
-- This will only insert if the user exists
INSERT INTO properties (
    user_id,
    name,
    address,
    type,
    year_built,
    square_feet,
    details
) 
SELECT 
    auth.uid(),
    'Main Residence',
    '{"street": "1234 Main Street, Austin, TX 78701"}'::jsonb,
    'Single Family Home',
    2010,
    2800,
    '{"bedrooms": 4, "bathrooms": 3, "lot_size": 0.25}'::jsonb
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM properties WHERE user_id = auth.uid() AND name = 'Main Residence'
);