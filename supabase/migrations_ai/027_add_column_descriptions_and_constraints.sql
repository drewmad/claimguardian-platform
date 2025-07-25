-- Add Column Descriptions and Verify Constraints for florida_parcels
-- ==================================================================

-- First, let's add comprehensive descriptions for each column
-- Based on Florida Department of Revenue property data standards

-- Administrative and Identification Fields
COMMENT ON COLUMN florida_parcels."CO_NO" IS 'County Number (1-67) - Sequential number assigned to each Florida county';
COMMENT ON COLUMN florida_parcels."PARCEL_ID" IS 'Unique Parcel Identifier - Primary key for property identification across the county';
COMMENT ON COLUMN florida_parcels."FILE_T" IS 'File Type - Indicates the source or type of property record';
COMMENT ON COLUMN florida_parcels."ASMNT_YR" IS 'Assessment Year - Tax year for which the assessment applies';
COMMENT ON COLUMN florida_parcels."BAS_STRT" IS 'Base Start Date - Beginning date for assessment calculations';
COMMENT ON COLUMN florida_parcels."ATV_STRT" IS 'Active Start Date - Date when property became active in system';
COMMENT ON COLUMN florida_parcels."GRP_NO" IS 'Group Number - Grouping code for similar properties';

-- Property Classification Codes
COMMENT ON COLUMN florida_parcels."DOR_UC" IS 'Department of Revenue Use Code - State-level property classification';
COMMENT ON COLUMN florida_parcels."PA_UC" IS 'Property Appraiser Use Code - Local property classification';
COMMENT ON COLUMN florida_parcels."SPASS_CD" IS 'Special Assessment Code - Indicates special assessment districts';

-- Valuation Fields (Core Financial Data)
COMMENT ON COLUMN florida_parcels."JV" IS 'Just Value (Market Value) - Fair market value as determined by Property Appraiser';
COMMENT ON COLUMN florida_parcels."JV_CHNG" IS 'Just Value Change - Dollar amount change from previous year';
COMMENT ON COLUMN florida_parcels."JV_CHNG_CD" IS 'Just Value Change Code - Reason code for value change';
COMMENT ON COLUMN florida_parcels."AV_SD" IS 'Assessed Value School District - Taxable value for school district taxes';
COMMENT ON COLUMN florida_parcels."AV_NSD" IS 'Assessed Value Non-School District - Taxable value for non-school taxes';
COMMENT ON COLUMN florida_parcels."TV_SD" IS 'Taxable Value School District - Final taxable value after exemptions for schools';
COMMENT ON COLUMN florida_parcels."TV_NSD" IS 'Taxable Value Non-School District - Final taxable value after exemptions for non-school';

-- Homestead and Exemption Values
COMMENT ON COLUMN florida_parcels."JV_HMSTD" IS 'Just Value Homestead Portion - Market value of homestead portion';
COMMENT ON COLUMN florida_parcels."AV_HMSTD" IS 'Assessed Value Homestead - Assessed value of homestead portion';
COMMENT ON COLUMN florida_parcels."JV_NON_HMS" IS 'Just Value Non-Homestead - Market value of non-homestead portion';
COMMENT ON COLUMN florida_parcels."AV_NON_HMS" IS 'Assessed Value Non-Homestead - Assessed value of non-homestead portion';
COMMENT ON COLUMN florida_parcels."JV_RESD_NO" IS 'Just Value Residential Non-Homestead - Value of residential non-homestead property';
COMMENT ON COLUMN florida_parcels."AV_RESD_NO" IS 'Assessed Value Residential Non-Homestead - Assessed value of residential non-homestead';

-- Special Classification Values
COMMENT ON COLUMN florida_parcels."JV_CLASS_U" IS 'Just Value Classified Use - Value under classified use assessment';
COMMENT ON COLUMN florida_parcels."AV_CLASS_U" IS 'Assessed Value Classified Use - Assessed value under classified use';
COMMENT ON COLUMN florida_parcels."JV_H2O_REC" IS 'Just Value Water Recharge - Value of water recharge lands';
COMMENT ON COLUMN florida_parcels."AV_H2O_REC" IS 'Assessed Value Water Recharge - Assessed value of water recharge lands';
COMMENT ON COLUMN florida_parcels."JV_CONSRV_" IS 'Just Value Conservation - Value of conservation lands';
COMMENT ON COLUMN florida_parcels."AV_CONSRV_" IS 'Assessed Value Conservation - Assessed value of conservation lands';
COMMENT ON COLUMN florida_parcels."JV_HIST_CO" IS 'Just Value Historic Commercial - Value of historic commercial property';
COMMENT ON COLUMN florida_parcels."AV_HIST_CO" IS 'Assessed Value Historic Commercial - Assessed value of historic commercial';
COMMENT ON COLUMN florida_parcels."JV_HIST_SI" IS 'Just Value Historic Significant - Value of historically significant property';
COMMENT ON COLUMN florida_parcels."AV_HIST_SI" IS 'Assessed Value Historic Significant - Assessed value of historic property';
COMMENT ON COLUMN florida_parcels."JV_WRKNG_W" IS 'Just Value Working Waterfront - Value of working waterfront property';
COMMENT ON COLUMN florida_parcels."AV_WRKNG_W" IS 'Assessed Value Working Waterfront - Assessed value of working waterfront';

-- Construction and Land Values
COMMENT ON COLUMN florida_parcels."NCONST_VAL" IS 'New Construction Value - Value of new construction added';
COMMENT ON COLUMN florida_parcels."DEL_VAL" IS 'Deletion Value - Value of improvements removed or demolished';
COMMENT ON COLUMN florida_parcels."PAR_SPLT" IS 'Parcel Split Indicator - Flag indicating if parcel was split';
COMMENT ON COLUMN florida_parcels."DISTR_CD" IS 'District Code - Tax district code';
COMMENT ON COLUMN florida_parcels."DISTR_YR" IS 'District Year - Year district was established';
COMMENT ON COLUMN florida_parcels."LND_VAL" IS 'Land Value - Assessed value of land only (no improvements)';
COMMENT ON COLUMN florida_parcels."LND_UNTS_C" IS 'Land Units Code - Unit of measurement for land (acres, sq ft, etc)';
COMMENT ON COLUMN florida_parcels."NO_LND_UNT" IS 'Number of Land Units - Quantity of land in specified units';
COMMENT ON COLUMN florida_parcels."LND_SQFOOT" IS 'Land Square Footage - Total square feet of land';

-- Building and Improvement Data
COMMENT ON COLUMN florida_parcels."DT_LAST_IN" IS 'Date Last Inspected - Most recent property inspection date';
COMMENT ON COLUMN florida_parcels."IMP_QUAL" IS 'Improvement Quality - Quality grade of improvements (1-9 scale)';
COMMENT ON COLUMN florida_parcels."CONST_CLAS" IS 'Construction Class - Type of construction (frame, masonry, etc)';
COMMENT ON COLUMN florida_parcels."EFF_YR_BLT" IS 'Effective Year Built - Adjusted year for depreciation calculations';
COMMENT ON COLUMN florida_parcels."ACT_YR_BLT" IS 'Actual Year Built - Original construction year';
COMMENT ON COLUMN florida_parcels."TOT_LVG_AR" IS 'Total Living Area - Heated/cooled square footage';
COMMENT ON COLUMN florida_parcels."NO_BULDNG" IS 'Number of Buildings - Count of structures on parcel';
COMMENT ON COLUMN florida_parcels."NO_RES_UNT" IS 'Number of Residential Units - Count of dwelling units';
COMMENT ON COLUMN florida_parcels."SPEC_FEAT_" IS 'Special Features Value - Value of pools, outbuildings, etc';

-- Sales History Fields (Most Recent Sale)
COMMENT ON COLUMN florida_parcels."M_PAR_SAL1" IS 'Multi-Parcel Sale 1 - Indicates if part of multi-parcel transaction';
COMMENT ON COLUMN florida_parcels."QUAL_CD1" IS 'Qualification Code 1 - Sales qualification code (U=Unqualified, Q=Qualified)';
COMMENT ON COLUMN florida_parcels."VI_CD1" IS 'Vacant/Improved Code 1 - V=Vacant, I=Improved at time of sale';
COMMENT ON COLUMN florida_parcels."SALE_PRC1" IS 'Sale Price 1 - Most recent sale price in dollars';
COMMENT ON COLUMN florida_parcels."SALE_YR1" IS 'Sale Year 1 - Year of most recent sale';
COMMENT ON COLUMN florida_parcels."SALE_MO1" IS 'Sale Month 1 - Month of most recent sale (1-12)';
COMMENT ON COLUMN florida_parcels."OR_BOOK1" IS 'Official Record Book 1 - Deed book number';
COMMENT ON COLUMN florida_parcels."OR_PAGE1" IS 'Official Record Page 1 - Deed page number';
COMMENT ON COLUMN florida_parcels."CLERK_NO1" IS 'Clerk Number 1 - Clerk instrument number';
COMMENT ON COLUMN florida_parcels."S_CHNG_CD1" IS 'Sale Change Code 1 - Reason for ownership change';

-- Sales History Fields (Previous Sale)
COMMENT ON COLUMN florida_parcels."M_PAR_SAL2" IS 'Multi-Parcel Sale 2 - Previous multi-parcel sale indicator';
COMMENT ON COLUMN florida_parcels."QUAL_CD2" IS 'Qualification Code 2 - Previous sale qualification';
COMMENT ON COLUMN florida_parcels."VI_CD2" IS 'Vacant/Improved Code 2 - Property status at previous sale';
COMMENT ON COLUMN florida_parcels."SALE_PRC2" IS 'Sale Price 2 - Previous sale price';
COMMENT ON COLUMN florida_parcels."SALE_YR2" IS 'Sale Year 2 - Year of previous sale';
COMMENT ON COLUMN florida_parcels."SALE_MO2" IS 'Sale Month 2 - Month of previous sale';
COMMENT ON COLUMN florida_parcels."OR_BOOK2" IS 'Official Record Book 2 - Previous deed book';
COMMENT ON COLUMN florida_parcels."OR_PAGE2" IS 'Official Record Page 2 - Previous deed page';
COMMENT ON COLUMN florida_parcels."CLERK_NO2" IS 'Clerk Number 2 - Previous clerk instrument number';
COMMENT ON COLUMN florida_parcels."S_CHNG_CD2" IS 'Sale Change Code 2 - Previous ownership change reason';

-- Owner Information
COMMENT ON COLUMN florida_parcels."OWN_NAME" IS 'Owner Name - Primary owner full name or entity';
COMMENT ON COLUMN florida_parcels."OWN_ADDR1" IS 'Owner Address Line 1 - Mailing address first line';
COMMENT ON COLUMN florida_parcels."OWN_ADDR2" IS 'Owner Address Line 2 - Mailing address second line';
COMMENT ON COLUMN florida_parcels."OWN_CITY" IS 'Owner City - Mailing address city';
COMMENT ON COLUMN florida_parcels."OWN_STATE" IS 'Owner State - Mailing address state code';
COMMENT ON COLUMN florida_parcels."OWN_ZIPCD" IS 'Owner ZIP Code - Mailing address ZIP';
COMMENT ON COLUMN florida_parcels."OWN_STATE_" IS 'Owner State Country - State/country for foreign addresses';

-- Fiduciary Information
COMMENT ON COLUMN florida_parcels."FIDU_NAME" IS 'Fiduciary Name - Trustee, executor, or agent name';
COMMENT ON COLUMN florida_parcels."FIDU_ADDR1" IS 'Fiduciary Address 1 - Agent mailing address line 1';
COMMENT ON COLUMN florida_parcels."FIDU_ADDR2" IS 'Fiduciary Address 2 - Agent mailing address line 2';
COMMENT ON COLUMN florida_parcels."FIDU_CITY" IS 'Fiduciary City - Agent city';
COMMENT ON COLUMN florida_parcels."FIDU_STATE" IS 'Fiduciary State - Agent state';
COMMENT ON COLUMN florida_parcels."FIDU_ZIPCD" IS 'Fiduciary ZIP - Agent ZIP code';
COMMENT ON COLUMN florida_parcels."FIDU_CD" IS 'Fiduciary Code - Type of fiduciary relationship';

-- Legal and Location Information
COMMENT ON COLUMN florida_parcels."S_LEGAL" IS 'Legal Description - Full legal description of property';
COMMENT ON COLUMN florida_parcels."APP_STAT" IS 'Appraisal Status - Current appraisal status code';
COMMENT ON COLUMN florida_parcels."CO_APP_STA" IS 'County Appraisal Status - County-specific status';
COMMENT ON COLUMN florida_parcels."MKT_AR" IS 'Market Area - Market area code for comparables';
COMMENT ON COLUMN florida_parcels."NBRHD_CD" IS 'Neighborhood Code - Neighborhood classification';
COMMENT ON COLUMN florida_parcels."PUBLIC_LND" IS 'Public Land Indicator - Flag for government-owned property';
COMMENT ON COLUMN florida_parcels."TAX_AUTH_C" IS 'Taxing Authority Code - Primary taxing authority';
COMMENT ON COLUMN florida_parcels."TWN" IS 'Township - Township designation';
COMMENT ON COLUMN florida_parcels."RNG" IS 'Range - Range designation';
COMMENT ON COLUMN florida_parcels."SEC" IS 'Section - Section number (1-36)';
COMMENT ON COLUMN florida_parcels."CENSUS_BK" IS 'Census Block - Census block identifier';

-- Physical Address
COMMENT ON COLUMN florida_parcels."PHY_ADDR1" IS 'Physical Address Line 1 - Street address of property';
COMMENT ON COLUMN florida_parcels."PHY_ADDR2" IS 'Physical Address Line 2 - Additional address information';
COMMENT ON COLUMN florida_parcels."PHY_CITY" IS 'Physical City - City where property is located';
COMMENT ON COLUMN florida_parcels."PHY_ZIPCD" IS 'Physical ZIP Code - ZIP code of property location';

-- Additional Identifiers
COMMENT ON COLUMN florida_parcels."ALT_KEY" IS 'Alternate Key - Alternative parcel identifier';
COMMENT ON COLUMN florida_parcels."ASS_TRNSFR" IS 'Assessment Transfer - Related to Save Our Homes portability';
COMMENT ON COLUMN florida_parcels."PREV_HMSTD" IS 'Previous Homestead - Previous homestead amount';
COMMENT ON COLUMN florida_parcels."ASS_DIF_TR" IS 'Assessment Difference Transfer - Portable assessment difference';
COMMENT ON COLUMN florida_parcels."CONO_PRV_H" IS 'County Number Previous Homestead - Previous homestead county';
COMMENT ON COLUMN florida_parcels."PARCEL_ID_" IS 'Previous Parcel ID - ID before renumbering';
COMMENT ON COLUMN florida_parcels."YR_VAL_TRN" IS 'Year Value Transfer - Year of value transfer';
COMMENT ON COLUMN florida_parcels."SEQ_NO" IS 'Sequence Number - Record sequence identifier';
COMMENT ON COLUMN florida_parcels."RS_ID" IS 'Roll Section ID - Tax roll section identifier';
COMMENT ON COLUMN florida_parcels."MP_ID" IS 'Map ID - Mapping system identifier';
COMMENT ON COLUMN florida_parcels."STATE_PAR_" IS 'State Parcel Number - Statewide parcel identifier';

-- Special Circumstances
COMMENT ON COLUMN florida_parcels."SPC_CIR_CD" IS 'Special Circumstance Code - Code for special tax circumstances';
COMMENT ON COLUMN florida_parcels."SPC_CIR_YR" IS 'Special Circumstance Year - Year special circumstance began';
COMMENT ON COLUMN florida_parcels."SPC_CIR_TX" IS 'Special Circumstance Text - Description of special circumstance';

-- GIS Fields
COMMENT ON COLUMN florida_parcels."Shape_Length" IS 'Shape Length - Perimeter of parcel in map units';
COMMENT ON COLUMN florida_parcels."Shape_Area" IS 'Shape Area - Area of parcel in map units';
COMMENT ON COLUMN florida_parcels."geometry_wkt" IS 'Geometry WKT - Well-Known Text representation of parcel boundary';

-- System Fields
COMMENT ON COLUMN florida_parcels."county_fips" IS 'County FIPS Code - Federal Information Processing Standard code (12001-12133)';
COMMENT ON COLUMN florida_parcels."county_id" IS 'County ID - Foreign key to florida_counties table';
COMMENT ON COLUMN florida_parcels."id" IS 'System ID - Auto-generated primary key';
COMMENT ON COLUMN florida_parcels."created_at" IS 'Created At - Timestamp when record was created';
COMMENT ON COLUMN florida_parcels."updated_at" IS 'Updated At - Timestamp when record was last modified';

-- Now let's add/verify constraints
-- =================================

-- Check and add constraints on numeric fields that should not be negative
ALTER TABLE florida_parcels ADD CONSTRAINT chk_jv_positive CHECK ("JV" >= 0);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_lnd_val_positive CHECK ("LND_VAL" >= 0);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_prc1_positive CHECK ("SALE_PRC1" >= 0);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_prc2_positive CHECK ("SALE_PRC2" >= 0);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_tot_lvg_ar_positive CHECK ("TOT_LVG_AR" >= 0);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_lnd_sqfoot_positive CHECK ("LND_SQFOOT" >= 0);

-- Constraints on year fields
ALTER TABLE florida_parcels ADD CONSTRAINT chk_asmnt_yr_valid CHECK ("ASMNT_YR" >= 1900 AND "ASMNT_YR" <= 2100);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_act_yr_blt_valid CHECK ("ACT_YR_BLT" IS NULL OR ("ACT_YR_BLT" >= 1600 AND "ACT_YR_BLT" <= 2100));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_eff_yr_blt_valid CHECK ("EFF_YR_BLT" IS NULL OR ("EFF_YR_BLT" >= 1600 AND "EFF_YR_BLT" <= 2100));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_yr1_valid CHECK ("SALE_YR1" IS NULL OR ("SALE_YR1" >= 1900 AND "SALE_YR1" <= 2100));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_yr2_valid CHECK ("SALE_YR2" IS NULL OR ("SALE_YR2" >= 1900 AND "SALE_YR2" <= 2100));

-- Constraints on month fields
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_mo1_valid CHECK ("SALE_MO1" IS NULL OR ("SALE_MO1" >= 1 AND "SALE_MO1" <= 12));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_sale_mo2_valid CHECK ("SALE_MO2" IS NULL OR ("SALE_MO2" >= 1 AND "SALE_MO2" <= 12));

-- Constraints on county fields
ALTER TABLE florida_parcels ADD CONSTRAINT chk_co_no_valid CHECK ("CO_NO" IS NULL OR ("CO_NO" >= 1 AND "CO_NO" <= 67));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_county_fips_valid CHECK (county_fips IS NULL OR (county_fips >= 12001 AND county_fips <= 12133));

-- Constraints on state codes (2-letter codes)
ALTER TABLE florida_parcels ADD CONSTRAINT chk_own_state_length CHECK ("OWN_STATE" IS NULL OR LENGTH("OWN_STATE") = 2);
ALTER TABLE florida_parcels ADD CONSTRAINT chk_fidu_state_length CHECK ("FIDU_STATE" IS NULL OR LENGTH("FIDU_STATE") = 2);

-- Quality code constraints
ALTER TABLE florida_parcels ADD CONSTRAINT chk_qual_cd1_valid CHECK ("QUAL_CD1" IS NULL OR "QUAL_CD1" IN ('U', 'Q', 'D', 'S'));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_qual_cd2_valid CHECK ("QUAL_CD2" IS NULL OR "QUAL_CD2" IN ('U', 'Q', 'D', 'S'));

-- Vacant/Improved code constraints
ALTER TABLE florida_parcels ADD CONSTRAINT chk_vi_cd1_valid CHECK ("VI_CD1" IS NULL OR "VI_CD1" IN ('V', 'I'));
ALTER TABLE florida_parcels ADD CONSTRAINT chk_vi_cd2_valid CHECK ("VI_CD2" IS NULL OR "VI_CD2" IN ('V', 'I'));

-- Create indexes for commonly searched fields (if not already exists)
CREATE INDEX IF NOT EXISTS idx_florida_parcels_own_state ON florida_parcels("OWN_STATE");
CREATE INDEX IF NOT EXISTS idx_florida_parcels_asmnt_yr ON florida_parcels("ASMNT_YR");
CREATE INDEX IF NOT EXISTS idx_florida_parcels_dor_uc ON florida_parcels("DOR_UC");
CREATE INDEX IF NOT EXISTS idx_florida_parcels_sale_yr1 ON florida_parcels("SALE_YR1");

-- Add a function to validate data quality
CREATE OR REPLACE FUNCTION validate_parcel_data(p_parcel_id VARCHAR)
RETURNS TABLE (
    field_name TEXT,
    issue TEXT
) AS $$
BEGIN
    -- Check for missing required data
    IF NOT EXISTS (SELECT 1 FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id) THEN
        RETURN QUERY SELECT 'PARCEL_ID'::TEXT, 'Parcel not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check for data quality issues
    RETURN QUERY
    WITH parcel AS (
        SELECT * FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id
    )
    SELECT 'JV'::TEXT, 'Just Value is zero or null'::TEXT
    FROM parcel WHERE "JV" IS NULL OR "JV" = 0
    UNION ALL
    SELECT 'OWN_NAME'::TEXT, 'Owner name is missing'::TEXT
    FROM parcel WHERE "OWN_NAME" IS NULL OR "OWN_NAME" = ''
    UNION ALL
    SELECT 'PHY_ADDR1'::TEXT, 'Physical address is missing'::TEXT
    FROM parcel WHERE "PHY_ADDR1" IS NULL OR "PHY_ADDR1" = ''
    UNION ALL
    SELECT 'SALE_YR1'::TEXT, 'Sale year is in the future'::TEXT
    FROM parcel WHERE "SALE_YR1" > EXTRACT(YEAR FROM CURRENT_DATE)
    UNION ALL
    SELECT 'ACT_YR_BLT'::TEXT, 'Year built is in the future'::TEXT
    FROM parcel WHERE "ACT_YR_BLT" > EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_parcel_data(VARCHAR) TO anon, authenticated;