export type BusinessIndustry =
  | 'restaurant'
  | 'retail'
  | 'manufacturing'
  | 'professional_services'
  | 'healthcare'
  | 'construction'
  | 'logistics'
  | 'other'

export type BusinessModel = 'b2b' | 'b2c' | 'both'
export type TeamSize = '1-5' | '6-20' | '21-50' | '51-200' | '200+'
export type RevenueModel = 'product_sales' | 'service_fees' | 'subscription' | 'project_based' | 'mixed'

export type OnboardingFormInput = {
  business_name: string
  industry: BusinessIndustry
  industry_other?: string
  business_model: BusinessModel
  team_size: TeamSize
  revenue_model: RevenueModel
  departments: string[]
  has_shifts: boolean
  shifts: { name: string; start: string; end: string }[]
  sells_products: boolean
  sells_services: boolean
  product_categories: string[]
  service_types: string[]
  focus_areas: string[]
  modules: {
    hr: boolean
    inventory: boolean
    supply_chain: boolean
    crm: boolean
  }
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export const INDUSTRY_OPTIONS: { value: BusinessIndustry; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant / Food service' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'professional_services', label: 'Professional services' },
  { value: 'healthcare', label: 'Healthcare / Clinic' },
  { value: 'construction', label: 'Construction' },
  { value: 'logistics', label: 'Logistics / Transportation' },
  { value: 'other', label: 'Other' },
]

export const BUSINESS_MODEL_OPTIONS: { value: BusinessModel; label: string }[] = [
  { value: 'b2c', label: 'B2C — sell to consumers' },
  { value: 'b2b', label: 'B2B — sell to businesses' },
  { value: 'both', label: 'Both B2B and B2C' },
]

export const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: '1-5', label: '1–5 people' },
  { value: '6-20', label: '6–20 people' },
  { value: '21-50', label: '21–50 people' },
  { value: '51-200', label: '51–200 people' },
  { value: '200+', label: '200+ people' },
]

export const REVENUE_MODEL_OPTIONS: { value: RevenueModel; label: string }[] = [
  { value: 'product_sales', label: 'Product sales' },
  { value: 'service_fees', label: 'Service fees' },
  { value: 'subscription', label: 'Subscription / recurring' },
  { value: 'project_based', label: 'Project-based billing' },
  { value: 'mixed', label: 'Mixed revenue streams' },
]

export const FOCUS_AREA_OPTIONS = [
  'Revenue growth',
  'Cost control',
  'Inventory accuracy',
  'Staff productivity',
  'Customer retention',
  'Cash flow',
  'Supplier reliability',
  'Compliance & reporting',
] as const

export const DEFAULT_DEPARTMENTS_BY_INDUSTRY: Record<BusinessIndustry, string[]> = {
  restaurant: ['Kitchen', 'Service', 'Procurement', 'Finance', 'Management'],
  retail: ['Sales', 'Warehouse', 'Marketing', 'Finance', 'Customer support'],
  manufacturing: ['Production', 'Quality', 'Procurement', 'Warehouse', 'Finance'],
  professional_services: ['Delivery', 'Sales', 'Operations', 'Finance', 'Admin'],
  healthcare: ['Clinical', 'Front desk', 'Billing', 'Pharmacy', 'Admin'],
  construction: ['Field operations', 'Estimating', 'Procurement', 'Safety', 'Finance'],
  logistics: ['Fleet', 'Dispatch', 'Warehouse', 'Customer service', 'Finance'],
  other: ['Operations', 'Sales', 'Finance', 'Admin'],
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0)
}

function parseCommaList(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeOnboardingFormInput(raw: unknown): OnboardingFormInput {
  const body = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const modulesRaw = (body.modules ?? {}) as Record<string, unknown>
  const industry = (body.industry as BusinessIndustry) || 'other'

  const departments = isStringArray(body.departments)
    ? body.departments.map((d) => d.trim())
    : parseCommaList(body.departments_text)

  const productCategories = isStringArray(body.product_categories)
    ? body.product_categories
    : parseCommaList(body.product_categories_text)

  const serviceTypes = isStringArray(body.service_types)
    ? body.service_types
    : parseCommaList(body.service_types_text)

  const focusAreas = isStringArray(body.focus_areas)
    ? body.focus_areas
    : Array.isArray(body.focus_areas)
      ? body.focus_areas.filter((item): item is string => typeof item === 'string')
      : []

  const shifts = Array.isArray(body.shifts)
    ? body.shifts
        .filter(
          (shift): shift is { name: string; start: string; end: string } =>
            typeof shift === 'object' &&
            shift !== null &&
            isNonEmptyString((shift as { name?: string }).name) &&
            isNonEmptyString((shift as { start?: string }).start) &&
            isNonEmptyString((shift as { end?: string }).end)
        )
        .map((shift) => ({
          name: shift.name.trim(),
          start: shift.start.trim(),
          end: shift.end.trim(),
        }))
    : []

  return {
    business_name: String(body.business_name ?? '').trim(),
    industry,
    industry_other: typeof body.industry_other === 'string' ? body.industry_other.trim() : undefined,
    business_model: (body.business_model as BusinessModel) || 'b2c',
    team_size: (body.team_size as TeamSize) || '1-5',
    revenue_model: (body.revenue_model as RevenueModel) || 'mixed',
    departments: departments.length > 0 ? departments : [...DEFAULT_DEPARTMENTS_BY_INDUSTRY[industry]],
    has_shifts: body.has_shifts === true,
    shifts: body.has_shifts === true ? shifts : [],
    sells_products: body.sells_products !== false,
    sells_services: body.sells_services === true,
    product_categories: productCategories,
    service_types: serviceTypes,
    focus_areas: focusAreas,
    modules: {
      hr: modulesRaw.hr !== false,
      inventory: modulesRaw.inventory !== false,
      supply_chain: modulesRaw.supply_chain === true,
      crm: modulesRaw.crm !== false,
    },
  }
}

export function validateOnboardingFormInput(raw: unknown): ValidationResult<OnboardingFormInput> {
  const form = normalizeOnboardingFormInput(raw)

  if (form.business_name.length < 2) {
    return { success: false, error: 'Business name is required.' }
  }

  if (form.industry === 'other' && (!form.industry_other || form.industry_other.length < 2)) {
    return { success: false, error: 'Please describe your industry.' }
  }

  if (form.departments.length < 1) {
    return { success: false, error: 'Add at least one department.' }
  }

  if (form.has_shifts && form.shifts.length < 1) {
    return { success: false, error: 'Add at least one shift or disable shift tracking.' }
  }

  if (!form.sells_products && !form.sells_services) {
    return { success: false, error: 'Select whether you sell products, services, or both.' }
  }

  if (form.sells_products && form.product_categories.length < 1) {
    return { success: false, error: 'Add at least one product category.' }
  }

  if (form.sells_services && form.service_types.length < 1) {
    return { success: false, error: 'Add at least one service type.' }
  }

  if (form.focus_areas.length < 1) {
    return { success: false, error: 'Select at least one business priority.' }
  }

  return { success: true, data: form }
}

export const EMPTY_ONBOARDING_FORM: OnboardingFormInput = {
  business_name: '',
  industry: 'retail',
  industry_other: '',
  business_model: 'b2c',
  team_size: '1-5',
  revenue_model: 'mixed',
  departments: [],
  has_shifts: false,
  shifts: [],
  sells_products: true,
  sells_services: false,
  product_categories: [],
  service_types: [],
  focus_areas: [],
  modules: {
    hr: true,
    inventory: true,
    supply_chain: false,
    crm: true,
  },
}
