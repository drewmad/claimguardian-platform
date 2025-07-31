import type { Asset, InventoryItem, HomeSystem, Structure, RenovationProject, MaintenanceTask, Warranty, PropertyDocument } from '@claimguardian/db'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PropertyState {
  // Properties
  properties: Asset[]
  selectedPropertyId: string | null
  
  // Property management
  getPropertyById: (id: string) => Asset | undefined
  getPrimaryProperty: () => Asset | undefined
  setSelectedProperty: (id: string | null) => void
  addProperty: (property: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProperty: (id: string, updates: Partial<Asset>) => void
  deleteProperty: (id: string) => void
  
  // Inventory management
  addInventoryItem: (propertyId: string, item: Omit<InventoryItem, 'id'>) => void
  updateInventoryItem: (propertyId: string, itemId: string, updates: Partial<InventoryItem>) => void
  deleteInventoryItem: (propertyId: string, itemId: string) => void
  bulkAddInventory: (propertyId: string, items: Omit<InventoryItem, 'id'>[]) => void
  
  // Home systems management
  addHomeSystem: (propertyId: string, system: Omit<HomeSystem, 'id'>) => void
  updateHomeSystem: (propertyId: string, systemId: string, updates: Partial<HomeSystem>) => void
  deleteHomeSystem: (propertyId: string, systemId: string) => void
  
  // Structures management
  addStructure: (propertyId: string, structure: Omit<Structure, 'id'>) => void
  updateStructure: (propertyId: string, structureId: string, updates: Partial<Structure>) => void
  deleteStructure: (propertyId: string, structureId: string) => void
  
  // Renovations management
  addRenovation: (propertyId: string, renovation: Omit<RenovationProject, 'id'>) => void
  updateRenovation: (propertyId: string, renovationId: string, updates: Partial<RenovationProject>) => void
  deleteRenovation: (propertyId: string, renovationId: string) => void
  
  // Maintenance management
  addMaintenanceTask: (propertyId: string, task: Omit<MaintenanceTask, 'id'>) => void
  updateMaintenanceTask: (propertyId: string, taskId: string, updates: Partial<MaintenanceTask>) => void
  deleteMaintenanceTask: (propertyId: string, taskId: string) => void
  
  // Warranty management
  addWarranty: (propertyId: string, warranty: Omit<Warranty, 'id'>) => void
  updateWarranty: (propertyId: string, warrantyId: string, updates: Partial<Warranty>) => void
  deleteWarranty: (propertyId: string, warrantyId: string) => void
  
  // Document management
  addDocument: (propertyId: string, document: Omit<PropertyDocument, 'id'>) => void
  updateDocument: (propertyId: string, documentId: string, updates: Partial<PropertyDocument>) => void
  deleteDocument: (propertyId: string, documentId: string) => void
  
  // Utility functions
  clearProperties: () => void
  syncPropertyData: (propertyId: string) => Promise<void>
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      selectedPropertyId: null,
      
      getPropertyById: (id) => get().properties.find(p => p.id === id),
      
      getPrimaryProperty: () => get().properties.find(p => p.isPrimaryResidence) || get().properties[0],
      
      setSelectedProperty: (id) => set({ selectedPropertyId: id }),
      
      addProperty: (propertyData) => {
        const id = generateId()
        const now = new Date().toISOString()
        const newProperty: Asset = {
          ...propertyData,
          id,
          createdAt: now,
          updatedAt: now,
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
          taxHistory: []
        }
        
        set(state => ({
          properties: [...state.properties, newProperty]
        }))
        
        return id
      },
      
      updateProperty: (id, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          )
        }))
      },
      
      deleteProperty: (id) => {
        set(state => ({
          properties: state.properties.filter(p => p.id !== id),
          selectedPropertyId: state.selectedPropertyId === id ? null : state.selectedPropertyId
        }))
      },
      
      // Inventory management
      addInventoryItem: (propertyId, item) => {
        const itemWithId = { ...item, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, inventory: [...(p.inventory || []), itemWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateInventoryItem: (propertyId, itemId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: (p.inventory || []).map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteInventoryItem: (propertyId, itemId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  inventory: (p.inventory || []).filter(item => item.id !== itemId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      bulkAddInventory: (propertyId, items) => {
        const itemsWithIds = items.map(item => ({ ...item, id: generateId() }))
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, inventory: [...(p.inventory || []), ...itemsWithIds], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      // Home systems management
      addHomeSystem: (propertyId, system) => {
        const systemWithId = { ...system, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, systems: [...(p.systems || []), systemWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateHomeSystem: (propertyId, systemId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  systems: (p.systems || []).map(system =>
                    system.id === systemId ? { ...system, ...updates } : system
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteHomeSystem: (propertyId, systemId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  systems: (p.systems || []).filter(system => system.id !== systemId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      // Structures management
      addStructure: (propertyId, structure) => {
        const structureWithId = { ...structure, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, structures: [...(p.structures || []), structureWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateStructure: (propertyId, structureId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  structures: (p.structures || []).map(structure =>
                    structure.id === structureId ? { ...structure, ...updates } : structure
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteStructure: (propertyId, structureId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  structures: (p.structures || []).filter(structure => structure.id !== structureId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      // Renovations management
      addRenovation: (propertyId, renovation) => {
        const renovationWithId = { ...renovation, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, renovations: [...(p.renovations || []), renovationWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateRenovation: (propertyId, renovationId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  renovations: (p.renovations || []).map(renovation =>
                    renovation.id === renovationId ? { ...renovation, ...updates } : renovation
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteRenovation: (propertyId, renovationId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  renovations: (p.renovations || []).filter(renovation => renovation.id !== renovationId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      // Maintenance management
      addMaintenanceTask: (propertyId, task) => {
        const taskWithId = { ...task, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, maintenanceTasks: [...(p.maintenanceTasks || []), taskWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateMaintenanceTask: (propertyId, taskId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  maintenanceTasks: (p.maintenanceTasks || []).map(task =>
                    task.id === taskId ? { ...task, ...updates } : task
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteMaintenanceTask: (propertyId, taskId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  maintenanceTasks: (p.maintenanceTasks || []).filter(task => task.id !== taskId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      // Warranty management
      addWarranty: (propertyId, warranty) => {
        const warrantyWithId = { ...warranty, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, warranties: [...(p.warranties || []), warrantyWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateWarranty: (propertyId, warrantyId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  warranties: (p.warranties || []).map(warranty =>
                    warranty.id === warrantyId ? { ...warranty, ...updates } : warranty
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteWarranty: (propertyId, warrantyId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  warranties: (p.warranties || []).filter(warranty => warranty.id !== warrantyId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      // Document management
      addDocument: (propertyId, document) => {
        const documentWithId = { ...document, id: generateId() }
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, documents: [...(p.documents || []), documentWithId], updatedAt: new Date().toISOString() }
              : p
          )
        }))
      },
      
      updateDocument: (propertyId, documentId, updates) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  documents: (p.documents || []).map(document =>
                    document.id === documentId ? { ...document, ...updates } : document
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      deleteDocument: (propertyId, documentId) => {
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? {
                  ...p,
                  documents: (p.documents || []).filter(document => document.id !== documentId),
                  updatedAt: new Date().toISOString()
                }
              : p
          )
        }))
      },
      
      clearProperties: () => set({ properties: [], selectedPropertyId: null }),
      
      syncPropertyData: async (propertyId) => {
        // TODO: Implement actual sync with Supabase
        set(state => ({
          properties: state.properties.map(p =>
            p.id === propertyId
              ? { ...p, lastSynced: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : p
          )
        }))
      }
    }),
    {
      name: 'property-storage',
      partialize: (state) => ({ properties: state.properties, selectedPropertyId: state.selectedPropertyId })
    }
  )
)