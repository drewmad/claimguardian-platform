/**
 * @fileMetadata
 * @purpose Server actions for geographic data (states, counties, cities, ZIP codes)
 * @owner frontend-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["getStates", "getCounties", "getCities", "getZipCodes", "validateAddress"]
 * @complexity medium
 * @tags ["server-action", "geographic", "database"]
 * @status active
 */
'use server'

import { createClient } from '@/lib/supabase/server'

interface State {
  id: number
  code: string
  name: string
  fips_code: string
  active: boolean
}

interface County {
  id: number
  state_id: number
  name: string
  fips_code: string
  state_fips: string
  county_fips: string
  active: boolean
}

interface City {
  id: number
  county_id: number
  state_id: number
  name: string
  active: boolean
}

interface ZipCode {
  id: number
  zip_code: string
  city_id: number
  county_id: number
  state_id: number
  primary_city: string
  latitude?: number
  longitude?: number
  active: boolean
}

export async function getStates() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .eq('active', true)
      .order('name')
    
    if (error) throw error
    
    return { data: data as State[], error: null }
  } catch (error) {
    console.error('Error fetching states:', error)
    return { data: null, error: error as Error }
  }
}

export async function getCounties(stateCode?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('counties')
      .select(`
        *,
        states!inner(code, name)
      `)
      .eq('active', true)
    
    if (stateCode) {
      query = query.eq('states.code', stateCode)
    }
    
    const { data, error } = await query.order('name')
    
    if (error) throw error
    
    return { data: data as (County & { states: { code: string; name: string } })[], error: null }
  } catch (error) {
    console.error('Error fetching counties:', error)
    return { data: null, error: error as Error }
  }
}

export async function getCities(countyId?: number, stateCode?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('cities')
      .select(`
        *,
        counties!inner(name, fips_code),
        states!inner(code, name)
      `)
      .eq('active', true)
    
    if (countyId) {
      query = query.eq('county_id', countyId)
    }
    
    if (stateCode) {
      query = query.eq('states.code', stateCode)
    }
    
    const { data, error } = await query.order('name')
    
    if (error) throw error
    
    return { 
      data: data as (City & { 
        counties: { name: string; fips_code: string }
        states: { code: string; name: string } 
      })[], 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching cities:', error)
    return { data: null, error: error as Error }
  }
}

export async function getZipCodes(zipCode?: string, cityId?: number, countyId?: number) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('zip_codes')
      .select(`
        *,
        cities!inner(name),
        counties!inner(name, fips_code),
        states!inner(code, name)
      `)
      .eq('active', true)
    
    if (zipCode) {
      query = query.eq('zip_code', zipCode)
    }
    
    if (cityId) {
      query = query.eq('city_id', cityId)
    }
    
    if (countyId) {
      query = query.eq('county_id', countyId)
    }
    
    const { data, error } = await query.order('zip_code')
    
    if (error) throw error
    
    return { 
      data: data as (ZipCode & { 
        cities: { name: string }
        counties: { name: string; fips_code: string }
        states: { code: string; name: string } 
      })[], 
      error: null 
    }
  } catch (error) {
    console.error('Error fetching ZIP codes:', error)
    return { data: null, error: error as Error }
  }
}

export async function validateAddress({
  zipCode,
  city,
  county,
  state
}: {
  zipCode?: string
  city?: string
  county?: string
  state?: string
}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('zip_codes')
      .select(`
        *,
        cities!inner(name),
        counties!inner(name),
        states!inner(code, name)
      `)
      .eq('active', true)
    
    if (zipCode) {
      query = query.eq('zip_code', zipCode)
    }
    
    if (state) {
      query = query.eq('states.code', state)
    }
    
    if (county) {
      query = query.ilike('counties.name', `%${county}%`)
    }
    
    if (city) {
      query = query.ilike('cities.name', `%${city}%`)
    }
    
    const { data, error } = await query.limit(10)
    
    if (error) throw error
    
    const isValid = data && data.length > 0
    const suggestions = data?.map(item => ({
      zipCode: item.zip_code,
      city: item.cities.name,
      county: item.counties.name,
      state: item.states.code,
      fullCity: item.primary_city
    })) || []
    
    return { 
      data: { 
        isValid, 
        suggestions,
        exactMatch: isValid && data.length === 1 ? suggestions[0] : null
      }, 
      error: null 
    }
  } catch (error) {
    console.error('Error validating address:', error)
    return { data: null, error: error as Error }
  }
}

// Temporary fallback data for Florida until database is ready
export async function getFloridaCountiesFallback() {
  const floridaCounties = [
    { id: 1, name: 'Alachua County', fips_code: '12001' },
    { id: 2, name: 'Baker County', fips_code: '12003' },
    { id: 3, name: 'Bay County', fips_code: '12005' },
    { id: 4, name: 'Bradford County', fips_code: '12007' },
    { id: 5, name: 'Brevard County', fips_code: '12009' },
    { id: 6, name: 'Broward County', fips_code: '12011' },
    { id: 7, name: 'Calhoun County', fips_code: '12013' },
    { id: 8, name: 'Charlotte County', fips_code: '12015' },
    { id: 9, name: 'Citrus County', fips_code: '12017' },
    { id: 10, name: 'Clay County', fips_code: '12019' },
    { id: 11, name: 'Collier County', fips_code: '12021' },
    { id: 12, name: 'Columbia County', fips_code: '12023' },
    { id: 13, name: 'DeSoto County', fips_code: '12027' },
    { id: 14, name: 'Dixie County', fips_code: '12029' },
    { id: 15, name: 'Duval County', fips_code: '12031' },
    { id: 16, name: 'Escambia County', fips_code: '12033' },
    { id: 17, name: 'Flagler County', fips_code: '12035' },
    { id: 18, name: 'Franklin County', fips_code: '12037' },
    { id: 19, name: 'Gadsden County', fips_code: '12039' },
    { id: 20, name: 'Gilchrist County', fips_code: '12041' },
    { id: 21, name: 'Glades County', fips_code: '12043' },
    { id: 22, name: 'Gulf County', fips_code: '12045' },
    { id: 23, name: 'Hamilton County', fips_code: '12047' },
    { id: 24, name: 'Hardee County', fips_code: '12049' },
    { id: 25, name: 'Hendry County', fips_code: '12051' },
    { id: 26, name: 'Hernando County', fips_code: '12053' },
    { id: 27, name: 'Highlands County', fips_code: '12055' },
    { id: 28, name: 'Hillsborough County', fips_code: '12057' },
    { id: 29, name: 'Holmes County', fips_code: '12059' },
    { id: 30, name: 'Indian River County', fips_code: '12061' },
    { id: 31, name: 'Jackson County', fips_code: '12063' },
    { id: 32, name: 'Jefferson County', fips_code: '12065' },
    { id: 33, name: 'Lafayette County', fips_code: '12067' },
    { id: 34, name: 'Lake County', fips_code: '12069' },
    { id: 35, name: 'Lee County', fips_code: '12071' },
    { id: 36, name: 'Leon County', fips_code: '12073' },
    { id: 37, name: 'Levy County', fips_code: '12075' },
    { id: 38, name: 'Liberty County', fips_code: '12077' },
    { id: 39, name: 'Madison County', fips_code: '12079' },
    { id: 40, name: 'Manatee County', fips_code: '12081' },
    { id: 41, name: 'Marion County', fips_code: '12083' },
    { id: 42, name: 'Martin County', fips_code: '12085' },
    { id: 43, name: 'Miami-Dade County', fips_code: '12086' },
    { id: 44, name: 'Monroe County', fips_code: '12087' },
    { id: 45, name: 'Nassau County', fips_code: '12089' },
    { id: 46, name: 'Okaloosa County', fips_code: '12091' },
    { id: 47, name: 'Okeechobee County', fips_code: '12093' },
    { id: 48, name: 'Orange County', fips_code: '12095' },
    { id: 49, name: 'Osceola County', fips_code: '12097' },
    { id: 50, name: 'Palm Beach County', fips_code: '12099' },
    { id: 51, name: 'Pasco County', fips_code: '12101' },
    { id: 52, name: 'Pinellas County', fips_code: '12103' },
    { id: 53, name: 'Polk County', fips_code: '12105' },
    { id: 54, name: 'Putnam County', fips_code: '12107' },
    { id: 55, name: 'St. Johns County', fips_code: '12109' },
    { id: 56, name: 'St. Lucie County', fips_code: '12111' },
    { id: 57, name: 'Santa Rosa County', fips_code: '12113' },
    { id: 58, name: 'Sarasota County', fips_code: '12115' },
    { id: 59, name: 'Seminole County', fips_code: '12117' },
    { id: 60, name: 'Sumter County', fips_code: '12119' },
    { id: 61, name: 'Suwannee County', fips_code: '12121' },
    { id: 62, name: 'Taylor County', fips_code: '12123' },
    { id: 63, name: 'Union County', fips_code: '12125' },
    { id: 64, name: 'Volusia County', fips_code: '12127' },
    { id: 65, name: 'Wakulla County', fips_code: '12129' },
    { id: 66, name: 'Walton County', fips_code: '12131' },
    { id: 67, name: 'Washington County', fips_code: '12133' }
  ]
  
  return { data: floridaCounties, error: null }
}