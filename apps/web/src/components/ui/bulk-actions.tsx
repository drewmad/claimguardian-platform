/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Bulk actions toolbar for managing multiple selected items"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { useState } from 'react'
import { Check, X, Trash2, Download, Archive, Tag, Shield, DollarSign, AlertCircle, CheckSquare, Square, MinusSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Card } from './card-variants'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './dropdown-menu'
import { toast } from 'sonner'

export interface BulkAction {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive'
  confirmMessage?: string
  action: (selectedIds: string[]) => Promise<void> | void
}

interface BulkActionsProps {
  selectedCount: number
  totalCount: number
  actions: BulkAction[]
  onSelectAll?: () => void
  onClearSelection?: () => void
  selectedIds: string[]
  className?: string
}

export function BulkActions({
  selectedCount,
  totalCount,
  actions,
  onSelectAll,
  onClearSelection,
  selectedIds,
  className
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const handleAction = async (action: BulkAction) => {
    if (action.confirmMessage) {
      const confirmed = window.confirm(action.confirmMessage)
      if (!confirmed) return
    }

    setIsProcessing(true)
    setProcessingAction(action.id)

    try {
      await action.action(selectedIds)
      toast.success(`${action.label} completed for ${selectedCount} items`)
      onClearSelection?.()
    } catch (error) {
      toast.error(`Failed to ${action.label.toLowerCase()}`)
      console.error('Bulk action error:', error)
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  if (selectedCount === 0) return null

  return (
    <Card variant="elevated" className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">
              {selectedCount} selected
            </span>
            {totalCount > 0 && (
              <span className="text-gray-400 text-sm">
                of {totalCount}
              </span>
            )}
          </div>

          {/* Select All / Clear */}
          <div className="flex items-center gap-2">
            {onSelectAll && selectedCount < totalCount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-blue-400 hover:text-blue-300"
              >
                Select All
              </Button>
            )}
            {onClearSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            const isProcessingThis = processingAction === action.id

            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => handleAction(action)}
                disabled={isProcessing}
                className="gap-2"
              >
                {Icon && (
                  <Icon className={cn(
                    'w-4 h-4',
                    isProcessingThis && 'animate-spin'
                  )} />
                )}
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

// Selection hook for managing bulk selections
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const isSelected = (id: string) => selectedIds.has(id)

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(items.map(item => item.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const selectRange = (startId: string, endId: string) => {
    const startIndex = items.findIndex(item => item.id === startId)
    const endIndex = items.findIndex(item => item.id === endId)

    if (startIndex === -1 || endIndex === -1) return

    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    const rangeIds = items.slice(from, to + 1).map(item => item.id)

    setSelectedIds(prev => {
      const next = new Set(prev)
      rangeIds.forEach(id => next.add(id))
      return next
    })
  }

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    isAllSelected: items.length > 0 && selectedIds.size === items.length,
    isPartiallySelected: selectedIds.size > 0 && selectedIds.size < items.length
  }
}

// Checkbox component for bulk selection
interface BulkCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  className?: string
}

export function BulkCheckbox({ checked, indeterminate, onChange, className }: BulkCheckboxProps) {
  const Icon = indeterminate ? MinusSquare : checked ? CheckSquare : Square

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className={cn(
        'p-1 hover:bg-gray-700 rounded transition-colors',
        className
      )}
    >
      <Icon className={cn(
        'w-5 h-5',
        checked || indeterminate ? 'text-blue-400' : 'text-gray-400'
      )} />
    </button>
  )
}

// Pre-defined bulk actions for insurance context
export const insuranceBulkActions: BulkAction[] = [
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    variant: 'destructive',
    confirmMessage: 'Are you sure you want to delete the selected items?',
    action: async (ids) => {
      // Implement delete logic
      console.log('Deleting:', ids)
    }
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    action: async (ids) => {
      // Implement export logic
      console.log('Exporting:', ids)
    }
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    action: async (ids) => {
      // Implement archive logic
      console.log('Archiving:', ids)
    }
  },
  {
    id: 'tag',
    label: 'Add Tag',
    icon: Tag,
    action: async (ids) => {
      // Implement tagging logic
      console.log('Tagging:', ids)
    }
  }
]
