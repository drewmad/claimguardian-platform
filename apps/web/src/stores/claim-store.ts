import type { Database } from '@claimguardian/db'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Database types
type DbClaim = Database['public']['Tables']['claims']['Row']
type ClaimStatus = Database['public']['Enums']['claim_status_enum']

// Extended types for the store
interface ClaimEvidence {
  id: string
  type: 'photo' | 'document' | 'video' | 'receipt' | 'estimate' | 'report'
  name: string
  description: string
  url: string
  uploadDate: string
}

interface ClaimStatusHistory {
  id: string
  date: string
  status: ClaimStatus
  notes?: string
}

interface ClaimContact {
  id: string
  role: 'Adjuster' | 'Contractor' | 'Attorney' | 'Public Adjuster' | 'Other'
  name: string
  company?: string
  phone?: string
  email?: string
}

interface ClaimPayment {
  id: string
  date: string
  amount: number
  type: 'Initial' | 'Supplemental' | 'Final' | 'Depreciation Recovery'
  checkNumber?: string
  description?: string
}

interface ClaimLineItem {
  id: string
  category: string
  item: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: 'pending' | 'approved' | 'denied' | 'partially_approved'
  rcv?: number
}

interface SettlementOffer {
  id: string
  claimId: string
  offerAmount: number
}

interface ClaimAppeal {
  id: string
  claimId: string
}

// Store claim type extends database claim with additional fields
interface Claim extends DbClaim {
  evidence: ClaimEvidence[]
  statusHistory: ClaimStatusHistory[]
  lineItems?: ClaimLineItem[]
  contacts?: ClaimContact[]
  payments?: ClaimPayment[]
  paidAmount?: number
  estimatedLoss?: number
  claimedAmount?: number
  closed_date?: string | null
}

interface ClaimState {
  // Claims
  claims: Claim[]
  selectedClaimId: string | null
  
  // Claim management
  getClaimById: (id: string) => Claim | undefined
  getClaimsByPropertyId: (propertyId: string) => Claim[]
  getActiveClaims: () => Claim[]
  setSelectedClaim: (id: string | null) => void
  addClaim: (claim: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateClaim: (id: string, updates: Partial<Claim>) => void
  deleteClaim: (id: string) => void
  
  // Evidence management
  addEvidence: (claimId: string, evidence: Omit<ClaimEvidence, 'id'>) => void
  updateEvidence: (claimId: string, evidenceId: string, updates: Partial<ClaimEvidence>) => void
  deleteEvidence: (claimId: string, evidenceId: string) => void
  bulkAddEvidence: (claimId: string, evidence: Omit<ClaimEvidence, 'id'>[]) => void
  
  // Status management
  updateClaimStatus: (claimId: string, status: ClaimStatus, notes?: string) => void
  addStatusHistory: (claimId: string, history: Omit<ClaimStatusHistory, 'id'>) => void
  
  // Contact management
  addContact: (claimId: string, contact: Omit<ClaimContact, 'id'>) => void
  updateContact: (claimId: string, contactId: string, updates: Partial<ClaimContact>) => void
  deleteContact: (claimId: string, contactId: string) => void
  
  // Line items management
  addLineItem: (claimId: string, item: Omit<ClaimLineItem, 'id'>) => void
  updateLineItem: (claimId: string, itemId: string, updates: Partial<ClaimLineItem>) => void
  deleteLineItem: (claimId: string, itemId: string) => void
  bulkAddLineItems: (claimId: string, items: Omit<ClaimLineItem, 'id'>[]) => void
  
  // Payment management
  addPayment: (claimId: string, payment: Omit<ClaimPayment, 'id'>) => void
  updatePayment: (claimId: string, paymentId: string, updates: Partial<ClaimPayment>) => void
  deletePayment: (claimId: string, paymentId: string) => void
  
  // Settlement offers
  addSettlementOffer: (claimId: string, offer: Omit<SettlementOffer, 'id' | 'claimId'>) => void
  updateSettlementOffer: (claimId: string, offerId: string, updates: Partial<SettlementOffer>) => void
  
  // Appeals
  addAppeal: (claimId: string) => void
  updateAppeal: (claimId: string, appealId: string, updates: Partial<ClaimAppeal>) => void
  
  // Utility functions
  clearClaims: () => void
  calculateClaimTotals: (claimId: string) => {
    estimatedLoss: number
    claimedAmount: number
    approvedAmount: number
    paidAmount: number
  }
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

export const useClaimStore = create<ClaimState>()(
  persist(
    (set, get) => ({
      claims: [],
      selectedClaimId: null,
      
      getClaimById: (id) => get().claims.find(c => c.id === id),
      
      getClaimsByPropertyId: (propertyId) => get().claims.filter(c => c.property_id === propertyId),
      
      getActiveClaims: () => get().claims.filter(c => 
        !['closed', 'denied'].includes(c.status)
      ),
      
      setSelectedClaim: (id) => set({ selectedClaimId: id }),
      
      addClaim: (claimData) => {
        const id = generateId()
        const now = new Date().toISOString()
        const newClaim: Claim = {
          ...claimData,
          id,
          created_at: now,
          updated_at: now,
          evidence: [],
          statusHistory: [{
            id: generateId(),
            date: now,
            status: claimData.status || 'draft',
            notes: 'Claim created'
          }],
          lineItems: [],
          contacts: [],
          payments: []
        }
        
        set(state => ({
          claims: [...state.claims, newClaim]
        }))
        
        return id
      },
      
      updateClaim: (id, updates) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          )
        }))
      },
      
      deleteClaim: (id) => {
        set(state => ({
          claims: state.claims.filter(c => c.id !== id),
          selectedClaimId: state.selectedClaimId === id ? null : state.selectedClaimId
        }))
      },
      
      // Evidence management
      addEvidence: (claimId, evidence) => {
        const evidenceWithId = { ...evidence, id: generateId() }
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, evidence: [...c.evidence, evidenceWithId], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      updateEvidence: (claimId, evidenceId, updates) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  evidence: c.evidence.map(e =>
                    e.id === evidenceId ? { ...e, ...updates } : e
                  ),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      deleteEvidence: (claimId, evidenceId) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  evidence: c.evidence.filter(e => e.id !== evidenceId),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      bulkAddEvidence: (claimId, evidence) => {
        const evidenceWithIds = evidence.map(e => ({ ...e, id: generateId() }))
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, evidence: [...c.evidence, ...evidenceWithIds], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      // Status management
      updateClaimStatus: (claimId, status, notes) => {
        const now = new Date().toISOString()
        const statusHistory: ClaimStatusHistory = {
          id: generateId(),
          date: now,
          status,
          notes
        }
        
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  status,
                  statusHistory: [...c.statusHistory, statusHistory],
                  updatedAt: now,
                  date_reported: status === 'submitted' && !c.date_reported ? now : c.date_reported,
                  closed_date: ['closed', 'denied'].includes(status) ? now : c.closed_date
                }
              : c
          )
        }))
      },
      
      addStatusHistory: (claimId, history) => {
        const historyWithId = { ...history, id: generateId() }
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, statusHistory: [...c.statusHistory, historyWithId], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      // Contact management
      addContact: (claimId, contact) => {
        const contactWithId = { ...contact, id: generateId() }
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, contacts: [...(c.contacts || []), contactWithId], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      updateContact: (claimId, contactId, updates) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  contacts: (c.contacts || []).map(contact =>
                    contact.id === contactId ? { ...contact, ...updates } : contact
                  ),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      deleteContact: (claimId, contactId) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  contacts: (c.contacts || []).filter(contact => contact.id !== contactId),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      // Line items management
      addLineItem: (claimId, item) => {
        const itemWithId = { ...item, id: generateId() }
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, lineItems: [...(c.lineItems || []), itemWithId], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      updateLineItem: (claimId, itemId, updates) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  lineItems: (c.lineItems || []).map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      deleteLineItem: (claimId, itemId) => {
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  lineItems: (c.lineItems || []).filter(item => item.id !== itemId),
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      bulkAddLineItems: (claimId, items) => {
        const itemsWithIds = items.map(item => ({ ...item, id: generateId() }))
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, lineItems: [...(c.lineItems || []), ...itemsWithIds], updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      // Payment management
      addPayment: (claimId, payment) => {
        const paymentWithId = { ...payment, id: generateId() }
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? {
                  ...c,
                  payments: [...(c.payments || []), paymentWithId],
                  paidAmount: (c.paidAmount || 0) + payment.amount,
                  updated_at: new Date().toISOString()
                }
              : c
          )
        }))
      },
      
      updatePayment: (claimId, paymentId, updates) => {
        set(state => ({
          claims: state.claims.map(c => {
            if (c.id === claimId) {
              const updatedPayments = (c.payments || []).map(p =>
                p.id === paymentId ? { ...p, ...updates } : p
              )
              const paidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
              
              return {
                ...c,
                payments: updatedPayments,
                paidAmount,
                updated_at: new Date().toISOString()
              }
            }
            return c
          })
        }))
      },
      
      deletePayment: (claimId, paymentId) => {
        set(state => ({
          claims: state.claims.map(c => {
            if (c.id === claimId) {
              const updatedPayments = (c.payments || []).filter(p => p.id !== paymentId)
              const paidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
              
              return {
                ...c,
                payments: updatedPayments,
                paidAmount,
                updated_at: new Date().toISOString()
              }
            }
            return c
          })
        }))
      },
      
      // Settlement offers
      addSettlementOffer: (claimId, offer) => {
        // Store settlement offers in a separate field if needed
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, settlementAmount: offer.offerAmount, updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      updateSettlementOffer: (claimId) => {
        // Update settlement offer logic
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      // Appeals
      addAppeal: (claimId) => {
        // Store appeals in a separate field if needed
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, status: 'under_review' as ClaimStatus, updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      updateAppeal: (claimId) => {
        // Update appeal logic
        set(state => ({
          claims: state.claims.map(c =>
            c.id === claimId
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          )
        }))
      },
      
      clearClaims: () => set({ claims: [], selectedClaimId: null }),
      
      calculateClaimTotals: (claimId) => {
        const claim = get().claims.find(c => c.id === claimId)
        if (!claim) return { estimatedLoss: 0, claimedAmount: 0, approvedAmount: 0, paidAmount: 0 }
        
        const lineItems = claim.lineItems || []
        const estimatedLoss = claim.estimatedLoss || 0
        const claimedAmount = claim.claimedAmount || lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const approvedAmount = lineItems
          .filter(item => item.status === 'approved' || item.status === 'partially_approved')
          .reduce((sum, item) => sum + (item.rcv || item.totalPrice), 0)
        const paidAmount = claim.paidAmount || 0
        
        return { estimatedLoss, claimedAmount, approvedAmount, paidAmount }
      }
    }),
    {
      name: 'claim-storage',
      partialize: (state) => ({ claims: state.claims, selectedClaimId: state.selectedClaimId })
    }
  )
)