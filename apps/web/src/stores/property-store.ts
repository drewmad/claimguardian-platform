/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Property management store with proper database types"
 * @dependencies ["@claimguardian/db", "zustand"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import type { Database } from "@claimguardian/db";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define types from the database schema - using fallback approach due to type truncation
type DatabaseProperty = {
  id: string | null;
  bathrooms: number | null;
  bedrooms: number | null;
  city: string | null;
  construction_type: string | null;
  county_id: string | null;
  county_name: string | null;
  created_at: string | null;
  current_value: number | null;
  electrical_year: number | null;
  evacuation_zone: string | null;
  flood_zone: string | null;
  full_address: string | null;
  garage_spaces: number | null;
  hvac_year: number | null;
  is_current: boolean | null;
  legal_description: string | null;
  location: unknown | null;
  lot_size_acres: number | null;
  metadata: any | null;
  mortgage_balance: number | null;
  occupancy_status: string | null;
  parcel_id: string | null;
  plumbing_year: number | null;
  pool: boolean | null;
  property_type: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  roof_type: string | null;
  roof_year: number | null;
  square_footage: number | null;
  state: string | null;
  stories: number | null;
  street_address: string | null;
  updated_at: string | null;
  user_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  version: number | null;
  version_id: string | null;
  wind_zone: string | null;
  year_built: number | null;
  zip_code: string | null;
};

type PropertyInsert = Omit<DatabaseProperty, "id" | "created_at" | "updated_at" | "version_id" | "valid_from" | "valid_to" | "is_current" | "full_address">;
type PropertyUpdate = Partial<Omit<DatabaseProperty, "id" | "created_at">>;

// Define additional types for property management (these might not exist in DB yet)
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  value: number;
  description?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  location?: string;
}

interface HomeSystem {
  id: string;
  name: string;
  type: "hvac" | "electrical" | "plumbing" | "security" | "solar";
  installation_date?: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  manufacturer?: string;
  model?: string;
}

interface Structure {
  id: string;
  name: string;
  type: "main_house" | "garage" | "shed" | "pool_house" | "deck" | "fence";
  square_footage?: number;
  materials?: string[];
  construction_year?: number;
  condition?: "excellent" | "good" | "fair" | "poor";
}

interface RenovationProject {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  completion_date?: string;
  cost?: number;
  contractor?: string;
  permits?: string[];
  status: "planned" | "in_progress" | "completed" | "cancelled";
}

interface MaintenanceTask {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed_date?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "overdue";
  estimated_cost?: number;
  actual_cost?: number;
  contractor?: string;
}

interface Warranty {
  id: string;
  item_name: string;
  category: string;
  purchase_date: string;
  warranty_period_months: number;
  expiry_date: string;
  manufacturer: string;
  warranty_type: "manufacturer" | "extended" | "service_plan";
  coverage_details?: string;
  claim_instructions?: string;
  is_transferable: boolean;
}

interface PropertyDocument {
  id: string;
  name: string;
  type: "deed" | "insurance" | "warranty" | "inspection" | "permit" | "tax" | "other";
  url?: string;
  upload_date: string;
  expiry_date?: string;
  description?: string;
}

// Extended property type for the store (includes additional local data)
type Property = DatabaseProperty & {
  // Additional fields for local property management
  inventory?: InventoryItem[];
  systems?: HomeSystem[];
  structures?: Structure[];
  renovations?: RenovationProject[];
  inspections?: any[];
  documents?: PropertyDocument[];
  maintenanceTasks?: MaintenanceTask[];
  warranties?: Warranty[];
  permits?: any[];
  easements?: any[];
  utilitiesInfo?: any[];
  identifiedMaterials?: any[];
  saleHistory?: any[];
  taxHistory?: any[];
  lastSynced?: string;
  // Legacy field support for backwards compatibility
  isPrimaryResidence?: boolean;
};

interface PropertyState {
  // Properties
  properties: Property[];
  selectedPropertyId: string | null;

  // Property management
  getPropertyById: (id: string) => Property | undefined;
  getPrimaryProperty: () => Property | undefined;
  setSelectedProperty: (id: string | null) => void;
  addProperty: (
    property: Omit<Property, "id" | "created_at" | "updated_at" | "version_id" | "valid_from" | "valid_to" | "is_current" | "full_address">,
  ) => string;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  // Inventory management
  addInventoryItem: (
    propertyId: string,
    item: Omit<InventoryItem, "id">,
  ) => void;
  updateInventoryItem: (
    propertyId: string,
    itemId: string,
    updates: Partial<InventoryItem>,
  ) => void;
  deleteInventoryItem: (propertyId: string, itemId: string) => void;
  bulkAddInventory: (
    propertyId: string,
    items: Omit<InventoryItem, "id">[],
  ) => void;

  // Home systems management
  addHomeSystem: (propertyId: string, system: Omit<HomeSystem, "id">) => void;
  updateHomeSystem: (
    propertyId: string,
    systemId: string,
    updates: Partial<HomeSystem>,
  ) => void;
  deleteHomeSystem: (propertyId: string, systemId: string) => void;

  // Structures management
  addStructure: (propertyId: string, structure: Omit<Structure, "id">) => void;
  updateStructure: (
    propertyId: string,
    structureId: string,
    updates: Partial<Structure>,
  ) => void;
  deleteStructure: (propertyId: string, structureId: string) => void;

  // Renovations management
  addRenovation: (
    propertyId: string,
    renovation: Omit<RenovationProject, "id">,
  ) => void;
  updateRenovation: (
    propertyId: string,
    renovationId: string,
    updates: Partial<RenovationProject>,
  ) => void;
  deleteRenovation: (propertyId: string, renovationId: string) => void;

  // Maintenance management
  addMaintenanceTask: (
    propertyId: string,
    task: Omit<MaintenanceTask, "id">,
  ) => void;
  updateMaintenanceTask: (
    propertyId: string,
    taskId: string,
    updates: Partial<MaintenanceTask>,
  ) => void;
  deleteMaintenanceTask: (propertyId: string, taskId: string) => void;

  // Warranty management
  addWarranty: (propertyId: string, warranty: Omit<Warranty, "id">) => void;
  updateWarranty: (
    propertyId: string,
    warrantyId: string,
    updates: Partial<Warranty>,
  ) => void;
  deleteWarranty: (propertyId: string, warrantyId: string) => void;

  // Document management
  addDocument: (
    propertyId: string,
    document: Omit<PropertyDocument, "id">,
  ) => void;
  updateDocument: (
    propertyId: string,
    documentId: string,
    updates: Partial<PropertyDocument>,
  ) => void;
  deleteDocument: (propertyId: string, documentId: string) => void;

  // Utility functions
  clearProperties: () => void;
  syncPropertyData: (propertyId: string) => Promise<void>;
}

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      selectedPropertyId: null,

      getPropertyById: (id) => get().properties.find((p) => p.id === id),

      getPrimaryProperty: () =>
        get().properties.find((p) => p.isPrimaryResidence) ||
        get().properties[0],

      setSelectedProperty: (id) => set({ selectedPropertyId: id }),

      addProperty: (propertyData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newProperty: Property = {
          ...propertyData,
          id,
          created_at: now,
          updated_at: now,
          version_id: generateId(),
          valid_from: now,
          valid_to: "infinity",
          is_current: true,
          version: 1,
          full_address: null, // This will be generated by the database
          // Initialize additional arrays
          inventory: [],
          systems: [],
          structures: [],
          renovations: [],
          inspections: [],
          documents: [],
          maintenanceTasks: [],
          warranties: [],
          permits: [],
          easements: [],
          utilitiesInfo: [],
          identifiedMaterials: [],
          saleHistory: [],
          taxHistory: [],
        };

        set((state) => ({
          properties: [...state.properties, newProperty],
        }));

        return id;
      },

      updateProperty: (id, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id
              ? { ...p, ...updates, updated_at: new Date().toISOString() }
              : p,
          ),
        }));
      },

      deleteProperty: (id) => {
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
          selectedPropertyId:
            state.selectedPropertyId === id ? null : state.selectedPropertyId,
        }));
      },

      // Inventory management
      addInventoryItem: (propertyId, item) => {
        const itemWithId = { ...item, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: [...(p.inventory || []), itemWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateInventoryItem: (propertyId, itemId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: (p.inventory || []).map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteInventoryItem: (propertyId, itemId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: (p.inventory || []).filter(
                    (item) => item.id !== itemId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      bulkAddInventory: (propertyId, items) => {
        const itemsWithIds = items.map((item) => ({
          ...item,
          id: generateId(),
        }));
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: [...(p.inventory || []), ...itemsWithIds],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Home systems management
      addHomeSystem: (propertyId, system) => {
        const systemWithId = { ...system, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  systems: [...(p.systems || []), systemWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateHomeSystem: (propertyId, systemId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  systems: (p.systems || []).map((system) =>
                    system.id === systemId ? { ...system, ...updates } : system,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteHomeSystem: (propertyId, systemId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  systems: (p.systems || []).filter(
                    (system) => system.id !== systemId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Structures management
      addStructure: (propertyId, structure) => {
        const structureWithId = { ...structure, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  structures: [...(p.structures || []), structureWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateStructure: (propertyId, structureId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  structures: (p.structures || []).map((structure) =>
                    structure.id === structureId
                      ? { ...structure, ...updates }
                      : structure,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteStructure: (propertyId, structureId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  structures: (p.structures || []).filter(
                    (structure) => structure.id !== structureId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Renovations management
      addRenovation: (propertyId, renovation) => {
        const renovationWithId = { ...renovation, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  renovations: [...(p.renovations || []), renovationWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateRenovation: (propertyId, renovationId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  renovations: (p.renovations || []).map((renovation) =>
                    renovation.id === renovationId
                      ? { ...renovation, ...updates }
                      : renovation,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteRenovation: (propertyId, renovationId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  renovations: (p.renovations || []).filter(
                    (renovation) => renovation.id !== renovationId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Maintenance management
      addMaintenanceTask: (propertyId, task) => {
        const taskWithId = { ...task, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  maintenanceTasks: [...(p.maintenanceTasks || []), taskWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateMaintenanceTask: (propertyId, taskId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  maintenanceTasks: (p.maintenanceTasks || []).map((task) =>
                    task.id === taskId ? { ...task, ...updates } : task,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteMaintenanceTask: (propertyId, taskId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  maintenanceTasks: (p.maintenanceTasks || []).filter(
                    (task) => task.id !== taskId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Warranty management
      addWarranty: (propertyId, warranty) => {
        const warrantyWithId = { ...warranty, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  warranties: [...(p.warranties || []), warrantyWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateWarranty: (propertyId, warrantyId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  warranties: (p.warranties || []).map((warranty) =>
                    warranty.id === warrantyId
                      ? { ...warranty, ...updates }
                      : warranty,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteWarranty: (propertyId, warrantyId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  warranties: (p.warranties || []).filter(
                    (warranty) => warranty.id !== warrantyId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      // Document management
      addDocument: (propertyId, document) => {
        const documentWithId = { ...document, id: generateId() };
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  documents: [...(p.documents || []), documentWithId],
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      updateDocument: (propertyId, documentId, updates) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  documents: (p.documents || []).map((document) =>
                    document.id === documentId
                      ? { ...document, ...updates }
                      : document,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      deleteDocument: (propertyId, documentId) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  documents: (p.documents || []).filter(
                    (document) => document.id !== documentId,
                  ),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },

      clearProperties: () => set({ properties: [], selectedPropertyId: null }),

      syncPropertyData: async (propertyId) => {
        // TODO: Implement actual sync with Supabase
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === propertyId
              ? {
                  ...p,
                  lastSynced: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        }));
      },
    }),
    {
      name: "property-storage",
      partialize: (state) => ({
        properties: state.properties,
        selectedPropertyId: state.selectedPropertyId,
      }),
    },
  ),
);