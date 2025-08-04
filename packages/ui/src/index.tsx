/**
 * @fileMetadata
 * @purpose Exports all UI components from the package.
 * @owner frontend-team
 * @dependencies ["./button", "./input", "./modal", "./card", "./label", "./checkbox", "./utils"]
 * @exports ["Button", "Input", "Modal", "Card", "Label", "Checkbox", "cn"]
 * @lastModifiedBy Drew Madison
 * @lastModifiedDate 2025-07-03T23:07:33-04:00
 * @complexity low
 * @tags ["component", "ui", "exports"]
 * @status active
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
export { cn } from './utils'
export { CheckIcon, XIcon } from './icons'

// Mock CameraCapture for build compatibility
// Note: Use local implementation in apps/web instead
export const CameraCapture = () => null
