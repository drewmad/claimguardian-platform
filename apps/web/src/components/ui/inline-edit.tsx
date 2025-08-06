/**
 * @fileMetadata
 * @owner @ui-team
 * @purpose "Inline editing component for quick field updates"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Edit2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

interface BaseInlineEditProps {
  value: string
  onSave: (value: string) => Promise<void> | void
  onCancel?: () => void
  className?: string
  editClassName?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
  validation?: (value: string) => string | null // Returns error message or null
}

interface TextInlineEditProps extends BaseInlineEditProps {
  type: 'text' | 'email' | 'number' | 'tel' | 'url'
  multiline?: false
}

interface TextareaInlineEditProps extends BaseInlineEditProps {
  type?: 'text'
  multiline: true
  rows?: number
}

interface SelectInlineEditProps extends Omit<BaseInlineEditProps, 'value'> {
  type: 'select'
  value: string
  options: Array<{ value: string; label: string }>
  onSave: (value: string) => Promise<void> | void
}

type InlineEditProps = TextInlineEditProps | TextareaInlineEditProps | SelectInlineEditProps

export function InlineEdit(props: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(props.value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      if ('select' in inputRef.current) {
        inputRef.current.focus()
      } else if ('setSelectionRange' in inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(0, inputRef.current.value.length)
      }
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(props.value)
  }, [props.value])

  const handleSave = async () => {
    if (props.required && !editValue.trim()) {
      setError('This field is required')
      return
    }

    if (props.validation) {
      const validationError = props.validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      await props.onSave(editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(props.value)
    setIsEditing(false)
    setError(null)
    props.onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && props.type !== 'select' && !props.multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group flex items-center gap-2 cursor-pointer',
          props.disabled && 'cursor-not-allowed opacity-50',
          props.className
        )}
        onClick={() => !props.disabled && setIsEditing(true)}
      >
        <span className={cn(
          'flex-1',
          !props.value && 'text-gray-500 italic'
        )}>
          {props.value || props.placeholder || 'Click to edit'}
        </span>
        {!props.disabled && (
          <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-2', props.className)}>
      <div className="flex-1 space-y-1">
        {props.type === 'select' ? (
          <Select
            value={editValue}
            onValueChange={setEditValue}
            disabled={isSaving}
          >
            <SelectTrigger 
              ref={inputRef as any}
              className={cn(
                'bg-gray-700 border-gray-600',
                error && 'border-red-500',
                props.editClassName
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {props.options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : props.multiline ? (
          <Textarea
            ref={inputRef as any}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder}
            disabled={isSaving}
            rows={props.rows || 3}
            className={cn(
              'bg-gray-700 border-gray-600',
              error && 'border-red-500',
              props.editClassName
            )}
          />
        ) : (
          <Input
            ref={inputRef as any}
            type={props.type || 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={props.placeholder}
            disabled={isSaving}
            className={cn(
              'bg-gray-700 border-gray-600',
              error && 'border-red-500',
              props.editClassName
            )}
          />
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Check className="w-4 h-4 text-white" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1.5 bg-gray-600 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}

// Convenience components for common use cases
export function InlineEditText(props: Omit<TextInlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="text" />
}

export function InlineEditEmail(props: Omit<TextInlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="email" />
}

export function InlineEditNumber(props: Omit<TextInlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="number" />
}

export function InlineEditTextarea(props: Omit<TextareaInlineEditProps, 'multiline'>) {
  return <InlineEdit {...props} multiline />
}

export function InlineEditSelect(props: Omit<SelectInlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="select" />
}

// Currency inline edit with formatting
export function InlineEditCurrency({ 
  value, 
  onSave,
  ...props 
}: {
  value: number
  onSave: (value: number) => Promise<void> | void
} & Omit<BaseInlineEditProps, 'value' | 'onSave'>) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const handleSave = async (stringValue: string) => {
    const numValue = parseFloat(stringValue.replace(/[^0-9.-]/g, ''))
    if (!isNaN(numValue)) {
      await onSave(numValue)
    }
  }

  return (
    <InlineEdit
      {...props}
      type="text"
      value={value.toString()}
      onSave={handleSave}
      validation={(val) => {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''))
        if (isNaN(num)) return 'Invalid number'
        if (num < 0) return 'Value must be positive'
        return null
      }}
    />
  )
}