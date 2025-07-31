/**
 * @fileMetadata
 * @purpose Provides a customizable label component.
 * @owner frontend-team
 * @dependencies ["react", "./utils"]
 * @exports ["Label"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity low
 * @tags ["component", "ui", "form", "label"]
 * @status active
 * @notes Used to associate text labels with form controls.
 */
'use client'

import * as React from 'react'

import { cn } from './utils'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }