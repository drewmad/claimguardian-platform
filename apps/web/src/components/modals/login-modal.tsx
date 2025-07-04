'use client'

/**
 * @fileMetadata
 * @purpose Provides a modal for user login.
 * @owner frontend-team
 * @dependencies ["@claimguardian/ui"]
 * @exports ["LoginModal"]
 * @complexity low
 * @tags ["modal", "authentication", "login", "form"]
 * @status active
 */
import { Modal, Button, Input, Label } from '@claimguardian/ui'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log In">
      <form className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="your@email.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">
          Log In
        </Button>
      </form>
    </Modal>
  )
}