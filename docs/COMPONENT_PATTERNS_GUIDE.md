# ClaimGuardian Component Patterns Guide

## Overview

Comprehensive guide to component patterns, conventions, and architectural decisions in the ClaimGuardian application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Component Categories](#component-categories)
- [Design Patterns](#design-patterns)
- [State Management Patterns](#state-management-patterns)
- [Data Fetching Patterns](#data-fetching-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Performance Patterns](#performance-patterns)
- [Testing Patterns](#testing-patterns)

---

## Architecture Overview

### Component Hierarchy

```
ClaimGuardian App
├── Layout Components
│   ├── DashboardLayout
│   ├── AuthLayout
│   └── PublicLayout
├── Page Components
│   ├── Dashboard Pages
│   ├── Auth Pages
│   └── Landing Pages
├── Feature Components
│   ├── Insurance Components
│   ├── Property Components
│   ├── Claims Components
│   └── AI Tool Components
├── UI Components
│   ├── Primitive Components
│   ├── Composite Components
│   └── Specialized Components
└── Utility Components
    ├── Providers
    ├── Hooks
    └── Utils
```

### File Organization

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── landing/           # Landing page components
│   ├── dashboard/         # Dashboard-specific components
│   ├── insurance/         # Insurance domain components
│   ├── property/          # Property domain components
│   ├── claims/            # Claims domain components
│   ├── ai-tools/          # AI feature components
│   └── modals/            # Modal components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── types/                 # TypeScript type definitions
└── app/                   # Next.js app directory
```

---

## Component Categories

### 1. Layout Components

Structural components that provide consistent layout and navigation.

```typescript
// DashboardLayout Pattern
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Usage
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}
```

### 2. Page Components

Top-level components that represent entire pages or routes.

```typescript
// Page Component Pattern
export default function InsurancePage() {
  // Page-level state and effects
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [policies, setPolicies] = useState<Policy[]>([])

  // Page-level data fetching
  useEffect(() => {
    fetchPolicies().then(setPolicies)
  }, [])

  // Page-level event handlers
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
  }, [])

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate">
      <PageHeader title="Insurance Management" />
      <InsuranceStats policies={policies} />
      <InsuranceFilters onFiltersChange={handleFiltersChange} />
      <InsurancePolicyList policies={filteredPolicies} />
    </motion.div>
  )
}
```

### 3. Feature Components

Domain-specific components that encapsulate business logic.

```typescript
// Feature Component Pattern
interface PolicyCardProps {
  policy: Policy
  onUpdate: (policy: Policy) => void
  onDelete: (id: string) => void
}

export function PolicyCard({ policy, onUpdate, onDelete }: PolicyCardProps) {
  // Component-specific state
  const [isEditing, setIsEditing] = useState(false)

  // Component-specific logic
  const handleSave = async (updatedPolicy: Policy) => {
    try {
      await updatePolicy(updatedPolicy)
      onUpdate(updatedPolicy)
      setIsEditing(false)
    } catch (error) {
      // Handle error
    }
  }

  return (
    <CardVariants variant="insurance" className="p-6">
      {isEditing ? (
        <PolicyEditForm
          policy={policy}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <PolicyDisplay
          policy={policy}
          onEdit={() => setIsEditing(true)}
          onDelete={() => onDelete(policy.id)}
        />
      )}
    </CardVariants>
  )
}
```

### 4. UI Components

Reusable interface components with minimal business logic.

```typescript
// Primitive UI Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors'

  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'hover:bg-gray-800 text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
```

---

## Design Patterns

### 1. Compound Components Pattern

For components with multiple related parts.

```typescript
// Compound Component Pattern
interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

export function Tabs({ children, defaultTab }: { children: React.ReactNode, defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs-container">
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex border-b border-gray-700">
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      className={cn(
        'px-4 py-2 border-b-2',
        isActive ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400'
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

export function TabContent({ value, children }: { value: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) return null

  const { activeTab } = context
  if (activeTab !== value) return null

  return <div className="mt-4">{children}</div>
}

// Usage
<Tabs defaultTab="overview">
  <TabsList>
    <Tab value="overview">Overview</Tab>
    <Tab value="details">Details</Tab>
    <Tab value="history">History</Tab>
  </TabsList>
  <TabContent value="overview"><OverviewPanel /></TabContent>
  <TabContent value="details"><DetailsPanel /></TabContent>
  <TabContent value="history"><HistoryPanel /></TabContent>
</Tabs>
```

### 2. Render Props Pattern

For flexible component composition.

```typescript
// Render Props Pattern
interface DataFetcherProps<T> {
  url: string
  children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode
}

export function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return <>{children(data, loading, error)}</>
}

// Usage
<DataFetcher<Policy[]> url="/api/policies">
  {(policies, loading, error) => {
    if (loading) return <LoadingSpinner />
    if (error) return <ErrorMessage error={error} />
    if (!policies) return <EmptyState />
    return <PolicyList policies={policies} />
  }}
</DataFetcher>
```

### 3. Higher-Order Component (HOC) Pattern

For cross-cutting concerns.

```typescript
// HOC Pattern
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error }>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent(props: P & { loading?: boolean }) {
    const { loading, ...componentProps } = props

    if (loading) {
      return <LoadingSpinner />
    }

    return <Component {...(componentProps as P)} />
  }
}

// Usage
const PolicyListWithErrorBoundary = withErrorBoundary(
  withLoading(PolicyList),
  PolicyErrorFallback
)
```

### 4. Custom Hook Pattern

For reusable stateful logic.

```typescript
// Custom Hook Pattern
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)

    asyncFunction()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, dependencies)

  return { data, error, loading, refetch: () => asyncFunction().then(setData) }
}

export function usePolicies() {
  const { data: policies, error, loading, refetch } = useAsync(
    () => fetch('/api/policies').then(res => res.json()),
    []
  )

  const createPolicy = useCallback(async (policy: CreatePolicyInput) => {
    const newPolicy = await fetch('/api/policies', {
      method: 'POST',
      body: JSON.stringify(policy)
    }).then(res => res.json())

    refetch() // Refresh the list
    return newPolicy
  }, [refetch])

  return { policies, error, loading, createPolicy }
}

// Usage
function PoliciesPage() {
  const { policies, loading, error, createPolicy } = usePolicies()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <PolicyList policies={policies} onCreate={createPolicy} />
}
```

---

## State Management Patterns

### 1. Local State Pattern

For component-specific state.

```typescript
export function PolicyForm({ policy, onSave }: PolicyFormProps) {
  // Form state
  const [formData, setFormData] = useState(policy || defaultPolicy)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Derived state
  const isValid = Object.keys(errors).length === 0
  const canSave = isValid && isDirty

  // Event handlers
  const handleChange = (field: keyof Policy, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validatePolicy(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      await onSave(formData)
      setIsDirty(false)
    } catch (error) {
      // Handle save error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### 2. Context Pattern

For sharing state across component trees.

```typescript
// Context Pattern
interface AppContextType {
  user: User | null
  properties: Property[]
  updateProperty: (property: Property) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<Property[]>([])

  const updateProperty = useCallback((updatedProperty: Property) => {
    setProperties(prev =>
      prev.map(p => p.id === updatedProperty.id ? updatedProperty : p)
    )
  }, [])

  const value = useMemo(() => ({
    user,
    properties,
    updateProperty
  }), [user, properties, updateProperty])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
```

### 3. Reducer Pattern

For complex state logic.

```typescript
// Reducer Pattern
interface PolicyState {
  policies: Policy[];
  selectedPolicy: Policy | null;
  filters: FilterOptions;
  loading: boolean;
  error: string | null;
}

type PolicyAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Policy[] }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SELECT_POLICY"; payload: Policy }
  | { type: "UPDATE_FILTERS"; payload: Partial<FilterOptions> }
  | { type: "ADD_POLICY"; payload: Policy }
  | { type: "UPDATE_POLICY"; payload: Policy }
  | { type: "DELETE_POLICY"; payload: string };

function policyReducer(state: PolicyState, action: PolicyAction): PolicyState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, policies: action.payload };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "SELECT_POLICY":
      return { ...state, selectedPolicy: action.payload };

    case "UPDATE_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "ADD_POLICY":
      return { ...state, policies: [...state.policies, action.payload] };

    case "UPDATE_POLICY":
      return {
        ...state,
        policies: state.policies.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
        selectedPolicy:
          state.selectedPolicy?.id === action.payload.id
            ? action.payload
            : state.selectedPolicy,
      };

    case "DELETE_POLICY":
      return {
        ...state,
        policies: state.policies.filter((p) => p.id !== action.payload),
        selectedPolicy:
          state.selectedPolicy?.id === action.payload
            ? null
            : state.selectedPolicy,
      };

    default:
      return state;
  }
}

export function usePolicyState() {
  const [state, dispatch] = useReducer(policyReducer, {
    policies: [],
    selectedPolicy: null,
    filters: defaultFilters,
    loading: false,
    error: null,
  });

  // Action creators
  const actions = useMemo(
    () => ({
      fetchPolicies: async () => {
        dispatch({ type: "FETCH_START" });
        try {
          const policies = await getPolicies();
          dispatch({ type: "FETCH_SUCCESS", payload: policies });
        } catch (error) {
          dispatch({ type: "FETCH_ERROR", payload: error.message });
        }
      },
      selectPolicy: (policy: Policy) =>
        dispatch({ type: "SELECT_POLICY", payload: policy }),
      updateFilters: (filters: Partial<FilterOptions>) =>
        dispatch({ type: "UPDATE_FILTERS", payload: filters }),
      addPolicy: (policy: Policy) =>
        dispatch({ type: "ADD_POLICY", payload: policy }),
      updatePolicy: (policy: Policy) =>
        dispatch({ type: "UPDATE_POLICY", payload: policy }),
      deletePolicy: (id: string) =>
        dispatch({ type: "DELETE_POLICY", payload: id }),
    }),
    [],
  );

  return { state, actions };
}
```

---

## Data Fetching Patterns

### 1. Server Actions Pattern (Next.js App Router)

For server-side data operations.

```typescript
// Server Actions
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPolicy(formData: FormData) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const policy = {
    name: formData.get('name') as string,
    type: formData.get('type') as PolicyType,
    userId: user.id
  }

  try {
    const newPolicy = await db.policies.create(policy)
    revalidatePath('/dashboard/insurance')
    return { success: true, policy: newPolicy }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Client Component
export function CreatePolicyForm() {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createPolicy(formData)
      if (result.success) {
        toast.success('Policy created successfully')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="name" required />
      <select name="type" required>
        <option value="ho3">HO3</option>
        <option value="flood">Flood</option>
      </select>
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Policy'}
      </button>
    </form>
  )
}
```

### 2. React Query Pattern

For client-side data fetching and caching.

```typescript
// React Query Pattern
export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: () => fetch('/api/policies').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreatePolicy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (policy: CreatePolicyInput) =>
      fetch('/api/policies', {
        method: 'POST',
        body: JSON.stringify(policy)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Policy created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })
}

// Component Usage
export function PoliciesPage() {
  const { data: policies, isLoading, error } = usePolicies()
  const createPolicyMutation = useCreatePolicy()

  const handleCreate = (policy: CreatePolicyInput) => {
    createPolicyMutation.mutate(policy)
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <PolicyList policies={policies} />
      <CreatePolicyButton
        onCreate={handleCreate}
        isLoading={createPolicyMutation.isPending}
      />
    </div>
  )
}
```

---

## Error Handling Patterns

### 1. Error Boundary Pattern

For catching React errors.

```typescript
// Error Boundary
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error to monitoring service
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      return <Fallback error={this.state.error!} />
    }

    return this.props.children
  }
}

// Error Fallback Component
export function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-red-400 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-400 mb-4">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Page
      </button>
    </div>
  )
}
```

### 2. Async Error Handling Pattern

For handling async operations.

```typescript
// Async Error Hook
export function useAsyncError() {
  const [, setError] = useState()

  return useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

// Usage in components
export function DataComponent() {
  const throwError = useAsyncError()

  const fetchData = async () => {
    try {
      const data = await fetch('/api/data')
      if (!data.ok) {
        throw new Error(`HTTP ${data.status}: ${data.statusText}`)
      }
      return await data.json()
    } catch (error) {
      throwError(error) // This will be caught by Error Boundary
    }
  }

  return <div>Component content</div>
}
```

---

## Performance Patterns

### 1. Memoization Pattern

For preventing unnecessary re-renders.

```typescript
// Memoized Component
export const PolicyCard = React.memo<PolicyCardProps>(
  ({ policy, onUpdate, onDelete }) => {
    return (
      <div className="policy-card">
        {/* Card content */}
      </div>
    )
  },
  // Custom comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.policy.id === nextProps.policy.id &&
      prevProps.policy.updatedAt === nextProps.policy.updatedAt
    )
  }
)

// Memoized Values and Callbacks
export function ExpensiveComponent({ data }: { data: any[] }) {
  // Memoize expensive calculations
  const expensiveValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0)
  }, [data])

  // Memoize event handlers
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, [])

  // Memoize filtered data
  const filteredData = useMemo(() => {
    return data.filter(item => item.active)
  }, [data])

  return (
    <div>
      <p>Total: {expensiveValue}</p>
      {filteredData.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      ))}
    </div>
  )
}
```

### 2. Lazy Loading Pattern

For code splitting and on-demand loading.

```typescript
// Dynamic Imports
const LazyPolicyEditor = lazy(() => import('./PolicyEditor'))
const LazyReportsPage = lazy(() => import('./ReportsPage'))

export function PolicyManagement() {
  const [showEditor, setShowEditor] = useState(false)

  return (
    <div>
      <button onClick={() => setShowEditor(true)}>
        Edit Policy
      </button>

      {showEditor && (
        <Suspense fallback={<LoadingSpinner />}>
          <LazyPolicyEditor />
        </Suspense>
      )}
    </div>
  )
}

// Route-level code splitting
import { lazy } from 'react'

const ReportsPage = lazy(() => import('./reports/page'))

export const routes = [
  {
    path: '/reports',
    component: ReportsPage
  }
]
```

### 3. Virtual Scrolling Pattern

For large lists.

```typescript
// Virtual List Hook
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const startIndex = Math.max(0, visibleStart - overscan)
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan)

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index
  }))

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }
  }
}

// Virtual List Component
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem
}: {
  items: T[]
  itemHeight: number
  height: number
  renderItem: (item: T, index: number) => React.ReactNode
}) {
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualList({
    items,
    itemHeight,
    containerHeight: height
  })

  return (
    <div
      style={{ height, overflow: 'auto' }}
      onScroll={onScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div key={index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Testing Patterns

### 1. Component Testing Pattern

For testing component behavior.

```typescript
// Component Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PolicyCard } from './PolicyCard'
import { mockPolicy } from '../__mocks__/policy'

describe('PolicyCard', () => {
  const defaultProps = {
    policy: mockPolicy,
    onUpdate: jest.fn(),
    onDelete: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders policy information', () => {
    render(<PolicyCard {...defaultProps} />)

    expect(screen.getByText(mockPolicy.name)).toBeInTheDocument()
    expect(screen.getByText(mockPolicy.carrier)).toBeInTheDocument()
  })

  it('calls onUpdate when edit button is clicked', async () => {
    render(<PolicyCard {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit/i })
    fireEvent.click(editButton)

    // Assume edit form appears
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith(mockPolicy)
    })
  })

  it('shows confirmation before deleting', () => {
    render(<PolicyCard {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
  })
})
```

### 2. Hook Testing Pattern

For testing custom hooks.

```typescript
// Hook Test
import { renderHook, act } from "@testing-library/react";
import { usePolicies } from "./usePolicies";

// Mock fetch
global.fetch = jest.fn();

describe("usePolicies", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("fetches policies on mount", async () => {
    const mockPolicies = [{ id: "1", name: "Test Policy" }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPolicies),
    });

    const { result } = renderHook(() => usePolicies());

    expect(result.current.loading).toBe(true);
    expect(result.current.policies).toEqual([]);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.policies).toEqual(mockPolicies);
  });

  it("handles fetch errors", async () => {
    const error = new Error("Failed to fetch");
    (fetch as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => usePolicies());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
  });
});
```

### 3. Integration Testing Pattern

For testing component interactions.

```typescript
// Integration Test
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PoliciesPage } from './PoliciesPage'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PoliciesPage Integration', () => {
  it('loads and displays policies', async () => {
    // Mock API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: '1', name: 'Home Insurance', carrier: 'State Farm' },
        { id: '2', name: 'Auto Insurance', carrier: 'Geico' }
      ])
    })

    renderWithProviders(<PoliciesPage />)

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Home Insurance')).toBeInTheDocument()
      expect(screen.getByText('Auto Insurance')).toBeInTheDocument()
    })
  })

  it('creates new policy', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '3', name: 'New Policy' })
      })

    renderWithProviders(<PoliciesPage />)

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    const createButton = screen.getByRole('button', { name: /create/i })
    fireEvent.click(createButton)

    // Fill form and submit
    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: 'New Policy' } })

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/policies', expect.objectContaining({
        method: 'POST'
      }))
    })
  })
})
```

---

_Last updated: August 2025_
_Version: 1.0_
_Maintainer: Frontend Team_
