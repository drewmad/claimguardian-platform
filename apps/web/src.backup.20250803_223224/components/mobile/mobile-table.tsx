
import { ChevronRight } from 'lucide-react'
import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface MobileTableProps {
  children: ReactNode
  className?: string
}

export function MobileTable({ children, className }: MobileTableProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  )
}

interface MobileTableRowProps {
  onClick?: () => void
  className?: string
  children: ReactNode
}

export function MobileTableRow({ 
  onClick, 
  className, 
  children 
}: MobileTableRowProps) {
  const isClickable = !!onClick

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gray-800 rounded-lg p-4",
        "transition-all duration-200",
        isClickable && [
          "cursor-pointer",
          "active:scale-[0.98]",
          "hover:bg-gray-750"
        ],
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileTableCellProps {
  label: string
  value: ReactNode
  action?: ReactNode
  prominent?: boolean
}

export function MobileTableCell({ 
  label, 
  value, 
  action,
  prominent = false 
}: MobileTableCellProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={cn(
          "truncate",
          prominent ? "text-base font-semibold text-white" : "text-sm text-gray-200"
        )}>
          {value}
        </p>
      </div>
      {action && (
        <div className="ml-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

// Responsive table that transforms to cards on mobile
interface ResponsiveTableProps<T = Record<string, unknown>> {
  headers: string[]
  data: T[]
  renderCell: (item: T, key: string) => ReactNode
  onRowClick?: (item: T) => void
  keyField: keyof T
}

export function ResponsiveTable({
  headers,
  data,
  renderCell,
  onRowClick,
  keyField
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              {headers.map((header) => (
                <th
                  key={header}
                  className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider pb-2"
                >
                  {header}
                </th>
              ))}
              {onRowClick && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((item) => (
              <tr
                key={String(item[keyField])}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-800"
                )}
              >
                {headers.map((header) => (
                  <td key={header} className="py-3 text-sm text-gray-300">
                    {renderCell(item, header)}
                  </td>
                ))}
                {onRowClick && (
                  <td className="py-3">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <MobileTable className="md:hidden">
        {data.map((item) => (
          <MobileTableRow
            key={String(item[keyField])}
            onClick={() => onRowClick?.(item)}
          >
            <div className="space-y-2">
              {headers.map((header, index) => (
                <MobileTableCell
                  key={header}
                  label={header}
                  value={renderCell(item, header)}
                  prominent={index === 0}
                  action={
                    index === 0 && onRowClick ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : undefined
                  }
                />
              ))}
            </div>
          </MobileTableRow>
        ))}
      </MobileTable>
    </>
  )
}
