/**
 * @fileMetadata
 * @purpose "Global modal state management using Zustand"
 * @owner frontend-team
 * @dependencies ["zustand"]
 * @exports ["useModalStore"]
 * @complexity low
 * @tags ["state", "modal", "zustand"]
 * @status stable
 * @notes Manages modal visibility and data across the application
 */
import { create } from 'zustand'

type ModalType =
  | 'login'
  | 'signup'
  | 'forgotPassword'
  | 'content'
  | 'securityQuestions'
  | 'sessionWarning'
  | 'success'
  | 'confirmation'
  | 'settings'
  | 'responsive-login'
  | 'responsive-signup'
  | 'responsive-forgot-password'
  | 'enhanced-forgot-password'
  | 'socialLogin'

interface ModalData {
  title?: string
  content?: {
    description?: string
    benefits?: string[]
    sections?: Array<{ title: string; content: string }>
  }
  [key: string]: unknown
}

interface ModalState {
  activeModal: ModalType | null
  modalData: ModalData | null
  openModal: (type: ModalType, data?: ModalData) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (type, data) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}))
