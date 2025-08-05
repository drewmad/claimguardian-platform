/**
 * @fileMetadata
 * @purpose "Type-safe lucide-react icon exports with React 18 compatibility"
 * @owner frontend-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["CheckIcon", "XIcon"]
 * @complexity low
 * @tags ["icons", "ui", "type-safety"]
 * @status stable
 * @notes Provides type assertions for lucide-react icons to ensure React 18 compatibility
 */

import { Check, X } from 'lucide-react'
import * as React from 'react'

// Type assertions to ensure React 18 compatibility
export const CheckIcon = Check as React.FC<React.SVGProps<SVGSVGElement>>
export const XIcon = X as React.FC<React.SVGProps<SVGSVGElement>>