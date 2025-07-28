
-- Verify all columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'florida_parcels'
    AND column_name IN (
        'own_state2', 'own_zipcda', 'nbrhd_cd1', 'nbrhd_cd2', 
        'nbrhd_cd3', 'nbrhd_cd4', 'dor_cd1', 'dor_cd2', 
        'dor_cd3', 'dor_cd4', 'ag_val', 'qual_cd2_', 
        'vi_cd2_', 'sale_prc2_', 'sale_yr2_', 'sale_mo2_', 
        'or_book2_', 'or_page2_', 'clerk_n_2', 'imp_val', 
        'const_val', 'distr_no', 'front', 'depth', 'cap', 
        'cape_shpa', 'latitude', 'longitude', 'pin_1', 'pin_2', 
        'half_cd', 'twp', 'sub', 'blk', 'lot', 'plat_book', 'plat_page'
    )
ORDER BY column_name;

-- Check the CSV import view
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'florida_parcels_csv_import'
    AND column_name IN ('OWN_STATE2', 'LATITUDE', 'LONGITUDE', 'PIN_1')
LIMIT 5;
