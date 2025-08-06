/**
 * @fileMetadata
 * @purpose "Exports all UI components from the package."
 * @owner frontend-team
 * @dependencies ["./button", "./input", "./modal", "./card", "./label", "./checkbox", "./utils"]
 * @exports ["Button", "Input", "Modal", "Card", "Label", "Checkbox", "cn"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity low
 * @tags ["component", "ui", "exports"]
 * @status stable
 * @notes Centralized export for easy import of UI components.
 */
export { Button } from './button'
export { Input } from './input'
export { SimpleModal as Modal } from './modal'
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './card'
export { Label } from './label'
export { Checkbox } from './checkbox'
export { Badge } from './badge'
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
export { Popover, PopoverTrigger, PopoverContent } from './popover'
export { Progress } from './progress'
export { Alert, AlertTitle, AlertDescription } from './alert'
export { Textarea } from './textarea'
export { cn } from './utils'
export { CheckIcon, XIcon } from './icons'

// Mock CameraCapture for build compatibility
// Note: Use local implementation in apps/web instead
export const CameraCapture = (props: Record<string, unknown>) => null