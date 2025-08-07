/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
// Asset and Property types for ClaimGuardian

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

export interface PropertyDetails {
  yearBuilt: number;
  effectiveYearBuilt?: number;
  sqFt: number;
  beds: number;
  baths: number;
  lotSize: number;
  estValue?: number;
  taxAssessed?: number;
  lastSale?: number;
}

export interface LandDetails {
  parcelId?: string;
  alternateFolio?: string;
  legalDescription?: string;
  zoning: string;
  floodZone?: string;
  utilities: string;
  topography: string;
  acreage: number;
  bfe?: number; // Base Flood Elevation
  seaLevelRise2050ft?: number;
  sinkholeRisk?: "Low" | "Moderate" | "High";
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type:
    | "Receipt"
    | "Warranty"
    | "Appraisal"
    | "Certificate"
    | "Manual"
    | "Other";
  date?: string;
  notes?: string;
  file?: File;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  value: number; // Current/replacement value
  purchasePrice?: number;
  images: string[];
  description: string;
  serial?: string;
  purchaseDate?: string;
  condition: "New" | "Excellent" | "Good" | "Fair" | "Poor";
  location: string;
  attachments: Attachment[];
  brand?: string;
  model?: string;
  confidence?: number;
  isApproved?: boolean;
  isScheduled?: boolean; // Is this a scheduled item on an insurance policy?
  heir?: string; // For estate planning
}

export interface HomeSystem {
  id: string;
  type:
    | "Roof"
    | "HVAC"
    | "Electrical"
    | "Plumbing"
    | "Water Heater"
    | "Pool Equipment"
    | "Security"
    | "Solar"
    | "Other";
  customType?: string;
  brand?: string;
  model?: string;
  age?: number;
  installationDate?: string;
  warrantyExpiryDate?: string;

  // Type-specific fields
  roofMaterial?: string;
  roofShape?: "Gable" | "Hip" | "Flat" | "Gambrel" | "Mansard" | "Other";
  hvacType?: string;
  tonnage?: number;
  seerRating?: number;
  heaterType?: "Tank" | "Tankless" | "Heat Pump";
  capacityGallons?: number;
  electricalPanelType?: string;
  amperage?: number;
  wiringMaterial?: "Copper" | "Aluminum" | "Knob & Tube";
  plumbingType?: string;
  septicOrSewer?: "Septic" | "Sewer";
  solarStatus?: "Owned" | "Leased";

  photos?: string[];
  attachments?: Attachment[];
  maintenanceHistory?: MaintenanceRecord[];
  nextMaintenanceDate?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  service: string;
  notes?: string;
  cost?: number;
  contractorId?: string;
}

export interface MaintenanceTask {
  id: string;
  assetId: string;
  task: string;
  status: "Upcoming" | "Completed" | "Overdue";
  dueDate: string;
  relatedSystemId?: string;
  recurringSchedule?: "Monthly" | "Quarterly" | "Annually" | "Bi-Annually";
  cost?: number;
  notes?: string;
  contractorId?: string;
}

export interface Permit {
  id: string;
  permitNumber: string;
  municipality: string;
  status:
    | "Applied"
    | "Approved"
    | "Inspection Required"
    | "Closed"
    | "Denied"
    | "Expired";
  issueDate?: string;
  finalizedDate?: string;
  notes?: string;
  attachments?: Attachment[];
}

export interface RenovationProject {
  id: string;
  assetId: string;
  name: string;
  status: "Planning" | "In Progress" | "On Hold" | "Completed";
  startDate?: string;
  endDate?: string;
  cost: number;
  permits?: Permit[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  contractorId?: string;
}

export interface PropertyInspection {
  id: string;
  date: string;
  type: "Annual" | "Pre-Purchase" | "Post-Storm" | "Insurance" | "Other";
  inspector?: string;
  exteriorPhotos: string[];
  rooms: RoomInspection[];
  findings?: string;
  reportUrl?: string;
}

export interface RoomInspection {
  id: string;
  name: string;
  type:
    | "Bedroom"
    | "Bathroom"
    | "Kitchen"
    | "Living Room"
    | "Dining Room"
    | "Office"
    | "Other";
  level: string; // 1st floor, 2nd floor, etc.
  size?: string; // e.g., "12x14"
  photos: string[];
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  finishMaterials?: {
    flooring?: string;
    walls?: string;
    ceiling?: string;
  };
  notes?: string;
}

export interface Warranty {
  id: string;
  assetId: string;
  provider: string;
  expirationDate: string;
  details: string;
  relatedSystemId?: string;
  relatedItemId?: string;
  documentUrl?: string;
}

export interface PropertyDocument {
  id: string;
  name: string;
  category:
    | "Deed"
    | "Survey"
    | "Title"
    | "Tax"
    | "Insurance"
    | "Permit"
    | "Warranty"
    | "Other";
  date: string;
  url: string;
  description?: string;
}

export interface SaleRecord {
  date: string;
  price: number;
  deedRef?: string;
  buyer?: string;
  seller?: string;
}

export interface TaxRecord {
  year: number;
  assessedValue: number;
  taxBill: number;
  isDelinquent: boolean;
  paymentDate?: string;
}

export interface Easement {
  id: string;
  type: "Utility" | "Access" | "Conservation" | "Other";
  description: string;
  recordedDate: string;
  documentUrl?: string;
}

export interface UtilityInfo {
  id: string;
  type: "Electric" | "Water" | "Sewer" | "Gas" | "Internet" | "Trash";
  provider: string;
  accountNumber?: string;
  averageMonthlyBill?: number;
}

export interface IdentifiedMaterial {
  id: string;
  assetId: string;
  name: string;
  type: "Roofing" | "Flooring" | "Countertop" | "Siding" | "Other";
  location: string;
  imageUrl: string;
  identifiedDate: string;
}

// Main Asset type that combines everything
export interface Asset {
  id: string;
  userId: string;
  name: string;
  type: "Property" | "Vehicle" | "Land";
  image?: string;
  value?: number; // Estimated market value
  coverage?: number; // Total insurance coverage

  // Property-specific fields
  isPrimaryResidence?: boolean;
  address?: PropertyAddress;
  details?: PropertyDetails;
  landDetails?: LandDetails;

  // Collections
  inventory?: InventoryItem[];
  systems?: HomeSystem[];
  structures?: Structure[];
  renovations?: RenovationProject[];
  inspections?: PropertyInspection[];
  documents?: PropertyDocument[];

  // Records
  saleHistory?: SaleRecord[];
  taxHistory?: TaxRecord[];
  permits?: Permit[];
  easements?: Easement[];
  utilitiesInfo?: UtilityInfo[];
  maintenanceTasks?: MaintenanceTask[];
  warranties?: Warranty[];
  identifiedMaterials?: IdentifiedMaterial[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastSynced?: string;
}

export interface Structure {
  id: string;
  type:
    | "Shed"
    | "Fence"
    | "Pool"
    | "Pool Enclosure"
    | "Gazebo"
    | "Garage"
    | "Dock"
    | "Other";
  customType?: string;
  material: string;
  dimensions?: string;
  value?: number;
  yearBuilt?: number;
  condition?: "Excellent" | "Good" | "Fair" | "Poor";
  photos?: string[];
}
