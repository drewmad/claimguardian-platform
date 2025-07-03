'use client'

import { Modal } from '@claimguardian/ui/modal'
import { Button } from '@claimguardian/ui/button'
import { Input } from '@claimguardian/ui/input'
import { Label } from '@claimguardian/ui/label'

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