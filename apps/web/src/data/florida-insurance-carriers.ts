/**
 * @fileMetadata
 * @purpose Florida insurance carriers list
 * @owner data-team
 * @dependencies []
 * @exports ["floridaInsuranceCarriers", "insuranceTypes"]
 * @complexity low
 * @tags ["data", "florida", "insurance"]
 * @status active
 */

export interface InsuranceCarrier {
  id: string
  name: string
  type: 'private' | 'state' | 'surplus'
  active: boolean
  website?: string
  phone?: string
}

export const insuranceTypes = [
  { value: 'HO3', label: 'HO-3 (Standard Homeowners)' },
  { value: 'HO5', label: 'HO-5 (Comprehensive)' },
  { value: 'HO6', label: 'HO-6 (Condo)' },
  { value: 'HO8', label: 'HO-8 (Older Home)' },
  { value: 'DP1', label: 'DP-1 (Basic Dwelling)' },
  { value: 'DP3', label: 'DP-3 (Special Dwelling)' },
  { value: 'FLOOD', label: 'Flood Insurance' },
  { value: 'WIND', label: 'Wind/Hurricane Only' },
  { value: 'UMBRELLA', label: 'Umbrella Policy' }
]

export const floridaInsuranceCarriers: InsuranceCarrier[] = [
  // State-Backed
  {
    id: 'citizens',
    name: 'Citizens Property Insurance Corporation',
    type: 'state',
    active: true,
    website: 'https://www.citizensfla.com',
    phone: '866-411-2742'
  },
  
  // Major Private Carriers Operating in Florida
  {
    id: 'state-farm',
    name: 'State Farm Florida Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.statefarm.com',
    phone: '800-782-8332'
  },
  {
    id: 'universal-property',
    name: 'Universal Property & Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.universalproperty.com',
    phone: '800-285-7854'
  },
  {
    id: 'heritage',
    name: 'Heritage Property & Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.hpcins.com',
    phone: '800-992-1172'
  },
  {
    id: 'fednat',
    name: 'FedNat Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.fednat.com',
    phone: '800-293-2532'
  },
  {
    id: 'tower-hill',
    name: 'Tower Hill Insurance',
    type: 'private',
    active: true,
    website: 'https://www.thig.com',
    phone: '800-342-3407'
  },
  {
    id: 'security-first',
    name: 'Security First Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.securityfirstflorida.com',
    phone: '877-581-4862'
  },
  {
    id: 'peoples-trust',
    name: 'People\'s Trust Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.peoplestrust.com',
    phone: '855-466-2738'
  },
  {
    id: 'american-integrity',
    name: 'American Integrity Insurance',
    type: 'private',
    active: true,
    website: 'https://www.aiiflorida.com',
    phone: '866-968-8390'
  },
  {
    id: 'st-johns',
    name: 'St. Johns Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.stjohnsinsurance.com',
    phone: '833-347-7727'
  },
  {
    id: 'southern-fidelity',
    name: 'Southern Fidelity Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.southernfidelity.com',
    phone: '800-499-1693'
  },
  {
    id: 'gulfstream',
    name: 'Gulfstream Property and Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.gulfstreaminsurance.com',
    phone: '866-485-3005'
  },
  {
    id: 'florida-peninsula',
    name: 'Florida Peninsula Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.floridapeninsula.com',
    phone: '877-229-2244'
  },
  {
    id: 'first-protective',
    name: 'First Protective Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.firstprotective.com',
    phone: '888-395-0055'
  },
  {
    id: 'american-strategic',
    name: 'American Strategic Insurance (ASI)',
    type: 'private',
    active: true,
    website: 'https://www.americanstrategic.com',
    phone: '866-274-8765'
  },
  {
    id: 'castle-key',
    name: 'Castle Key Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.allstate.com',
    phone: '800-255-7828'
  },
  {
    id: 'olympus',
    name: 'Olympus Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.olympusinsurance.com',
    phone: '866-281-2242'
  },
  {
    id: 'safepoint',
    name: 'Safepoint Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.safepointins.com',
    phone: '877-344-7693'
  },
  {
    id: 'edison',
    name: 'Edison Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.edisoninsurance.com',
    phone: '866-269-8264'
  },
  {
    id: 'homeowners-choice',
    name: 'Homeowners Choice Property & Casualty',
    type: 'private',
    active: true,
    website: 'https://www.hcpci.com',
    phone: '888-500-4227'
  },
  {
    id: 'prepared',
    name: 'Prepared Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.preparedins.com',
    phone: '833-277-3778'
  },
  {
    id: 'weston',
    name: 'Weston Property and Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.westonins.com',
    phone: '888-259-5014'
  },
  {
    id: 'avatar',
    name: 'Avatar Property & Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.avatarins.com',
    phone: '877-503-0650'
  },
  {
    id: 'elements',
    name: 'Elements Property Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.elementspci.com',
    phone: '877-503-0650'
  },
  {
    id: 'american-traditions',
    name: 'American Traditions Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.americantraditions.com',
    phone: '727-893-1600'
  },
  {
    id: 'typtap',
    name: 'TypTap Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.typtap.com',
    phone: '844-897-8271'
  },
  {
    id: 'kin',
    name: 'Kin Insurance',
    type: 'private',
    active: true,
    website: 'https://www.kin.com',
    phone: '866-204-2219'
  },
  {
    id: 'slide',
    name: 'Slide Insurance',
    type: 'private',
    active: true,
    website: 'https://www.slide.com',
    phone: '813-579-3100'
  },
  {
    id: 'united-property',
    name: 'United Property & Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.upcinsurance.com',
    phone: '800-399-7677'
  },
  {
    id: 'florida-family',
    name: 'Florida Family Insurance Company',
    type: 'private',
    active: true,
    website: 'https://www.myfloridafamily.com',
    phone: '888-908-3863'
  },
  {
    id: 'anchor',
    name: 'Anchor Property & Casualty Insurance',
    type: 'private',
    active: true,
    website: 'https://www.anchorpci.com',
    phone: '855-200-9992'
  },
  
  // Surplus Lines Carriers
  {
    id: 'lloyds-london',
    name: 'Lloyd\'s of London',
    type: 'surplus',
    active: true,
    website: 'https://www.lloyds.com',
    phone: '44-20-7327-1000'
  },
  {
    id: 'scottsdale',
    name: 'Scottsdale Insurance Company',
    type: 'surplus',
    active: true,
    website: 'https://www.scottsdaleins.com',
    phone: '800-423-7675'
  },
  {
    id: 'lexington',
    name: 'Lexington Insurance Company',
    type: 'surplus',
    active: true,
    website: 'https://www.aig.com',
    phone: '877-344-6876'
  },
  
  // Other/Self-Insured Option
  {
    id: 'self-insured',
    name: 'Self-Insured / No Insurance',
    type: 'private',
    active: true
  },
  {
    id: 'other',
    name: 'Other (Not Listed)',
    type: 'private',
    active: true
  }
]

// Sort carriers alphabetically within their types
export const sortedFloridaInsuranceCarriers = (() => {
  const stateCarriers = floridaInsuranceCarriers
    .filter(c => c.type === 'state')
    .sort((a, b) => a.name.localeCompare(b.name))
  
  const privateCarriers = floridaInsuranceCarriers
    .filter(c => c.type === 'private' && c.id !== 'self-insured' && c.id !== 'other')
    .sort((a, b) => a.name.localeCompare(b.name))
  
  const surplusCarriers = floridaInsuranceCarriers
    .filter(c => c.type === 'surplus')
    .sort((a, b) => a.name.localeCompare(b.name))
  
  const specialOptions = floridaInsuranceCarriers
    .filter(c => c.id === 'self-insured' || c.id === 'other')
    .sort((a, b) => a.name.localeCompare(b.name))
  
  return [...stateCarriers, ...privateCarriers, ...surplusCarriers, ...specialOptions]
})()