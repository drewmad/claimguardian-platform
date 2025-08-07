import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseNumber = searchParams.get('license');
    
    if (!licenseNumber) {
      return NextResponse.json({ 
        error: 'License number required' 
      }, { status: 400 });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Get license details
    const { data: license, error: licenseError } = await supabase
      .from('dbpr_licenses')
      .select('*')
      .eq('license_number', licenseNumber)
      .eq('is_current', true)
      .single();
    
    if (licenseError || !license) {
      return NextResponse.json({ 
        valid: false,
        message: 'License not found or inactive'
      }, { status: 404 });
    }
    
    // Get license history
    const { data: history } = await supabase
      .from('dbpr_licenses_history')
      .select('*')
      .eq('license_number', licenseNumber)
      .order('changed_at', { ascending: false })
      .limit(10);
    
    // Check license validity
    const now = new Date();
    const expirationDate = license.expiration_date ? new Date(license.expiration_date) : null;
    const isExpired = expirationDate && expirationDate < now;
    
    // Check insurance validity
    const insuranceExpiration = license.insurance_expiration ? new Date(license.insurance_expiration) : null;
    const insuranceExpired = insuranceExpiration && insuranceExpiration < now;
    
    return NextResponse.json({
      valid: !isExpired && license.status === 'active',
      license: {
        licenseNumber: license.license_number,
        type: license.license_type,
        status: license.status,
        businessName: license.business_name,
        licenseeName: license.licensee_name,
        address: {
          line1: license.address_line1,
          line2: license.address_line2,
          city: license.city,
          state: license.state,
          zip: license.zip_code,
          county: license.county
        },
        contact: {
          phone: license.phone,
          email: license.email
        },
        dates: {
          originalIssue: license.original_issue_date,
          expiration: license.expiration_date,
          lastRenewal: license.last_renewal_date
        },
        insurance: {
          carrier: license.insurance_carrier,
          policyNumber: license.insurance_policy_number,
          expiration: license.insurance_expiration,
          expired: insuranceExpired
        },
        bond: {
          amount: license.bond_amount,
          company: license.bond_company
        }
      },
      validation: {
        isExpired,
        daysUntilExpiration: expirationDate ? Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
        insuranceExpired,
        lastUpdated: license.last_updated
      },
      history: history?.map(h => ({
        changeType: h.change_type,
        changedAt: h.changed_at,
        changedFields: h.changed_fields
      })) || []
    });
    
  } catch (error) {
    console.error('License verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}