'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/logo'
import {
  BUSINESS_MODEL_OPTIONS,
  DEFAULT_DEPARTMENTS_BY_INDUSTRY,
  EMPTY_ONBOARDING_FORM,
  FOCUS_AREA_OPTIONS,
  INDUSTRY_OPTIONS,
  REVENUE_MODEL_OPTIONS,
  TEAM_SIZE_OPTIONS,
  type BusinessIndustry,
  type OnboardingFormInput,
} from '@/lib/onboarding-form'

const FORM_DRAFT_KEY = 'rigbase_onboarding_form_v1'

const STEPS = [
  { id: 'business', title: 'Business profile', description: 'Tell us about your company' },
  { id: 'structure', title: 'Team & structure', description: 'Departments and operating hours' },
  { id: 'offerings', title: 'Products & services', description: 'What you sell and deliver' },
  { id: 'modules', title: 'Modules & priorities', description: 'Choose your ERP setup' },
] as const

const inputClass =
  'w-full px-3 py-2.5 bg-bg-tertiary border border-border-primary rounded-lg focus:outline-none focus:border-accent/60'
const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5'

function parseTags(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinTags(values: string[]): string {
  return values.join(', ')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OnboardingFormInput>(EMPTY_ONBOARDING_FORM)
  const [departmentInput, setDepartmentInput] = useState('')
  const [productCategoriesInput, setProductCategoriesInput] = useState('')
  const [serviceTypesInput, setServiceTypesInput] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const workspaceRes = await fetch('/api/workspace')
        if (!active) return
        if (workspaceRes.ok) {
          localStorage.removeItem(FORM_DRAFT_KEY)
          router.replace('/dashboard')
          router.refresh()
          return
        }
      } catch {
        // continue
      }

      if (!active) return

      try {
        const raw = localStorage.getItem(FORM_DRAFT_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as OnboardingFormInput
          setForm({
            ...EMPTY_ONBOARDING_FORM,
            ...parsed,
            departments:
              parsed.departments?.length > 0
                ? parsed.departments
                : [...DEFAULT_DEPARTMENTS_BY_INDUSTRY[parsed.industry ?? 'retail']],
          })
          setProductCategoriesInput(joinTags(parsed.product_categories ?? []))
          setServiceTypesInput(joinTags(parsed.service_types ?? []))
        } else {
          setForm((prev) => ({
            ...prev,
            departments: [...DEFAULT_DEPARTMENTS_BY_INDUSTRY[prev.industry]],
          }))
        }
      } catch {
        // ignore invalid draft
      }

      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (!active) return

      const businessName = String(data.user?.user_metadata?.business_name ?? '').trim()
      if (businessName) {
        setForm((prev) => (prev.business_name ? prev : { ...prev, business_name: businessName }))
      }

      setInitialLoading(false)
    })()

    return () => {
      active = false
    }
  }, [router])

  useEffect(() => {
    if (initialLoading) return
    localStorage.setItem(
      FORM_DRAFT_KEY,
      JSON.stringify({
        ...form,
        product_categories: parseTags(productCategoriesInput),
        service_types: parseTags(serviceTypesInput),
      })
    )
  }, [form, productCategoriesInput, serviceTypesInput, initialLoading])

  function withParsedOfferings(data: OnboardingFormInput = form): OnboardingFormInput {
    return {
      ...data,
      product_categories: parseTags(productCategoriesInput),
      service_types: parseTags(serviceTypesInput),
    }
  }

  function syncOfferingsToForm() {
    setForm((prev) => withParsedOfferings(prev))
  }

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step])

  function updateForm<K extends keyof OnboardingFormInput>(key: K, value: OnboardingFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleIndustryChange(industry: BusinessIndustry) {
    setForm((prev) => ({
      ...prev,
      industry,
      departments:
        prev.departments.length > 0 &&
        JSON.stringify(prev.departments) !== JSON.stringify(DEFAULT_DEPARTMENTS_BY_INDUSTRY[prev.industry])
          ? prev.departments
          : [...DEFAULT_DEPARTMENTS_BY_INDUSTRY[industry]],
    }))
  }

  function addDepartment() {
    const value = departmentInput.trim()
    if (!value) return
    if (form.departments.includes(value)) {
      toast.error('Department already added')
      return
    }
    updateForm('departments', [...form.departments, value])
    setDepartmentInput('')
  }

  function removeDepartment(name: string) {
    updateForm(
      'departments',
      form.departments.filter((item) => item !== name)
    )
  }

  function addShift() {
    updateForm('shifts', [...form.shifts, { name: 'Day Shift', start: '09:00', end: '17:00' }])
  }

  function updateShift(index: number, field: 'name' | 'start' | 'end', value: string) {
    updateForm(
      'shifts',
      form.shifts.map((shift, i) => (i === index ? { ...shift, [field]: value } : shift))
    )
  }

  function removeShift(index: number) {
    updateForm(
      'shifts',
      form.shifts.filter((_, i) => i !== index)
    )
  }

  function toggleFocusArea(area: string) {
    updateForm(
      'focus_areas',
      form.focus_areas.includes(area)
        ? form.focus_areas.filter((item) => item !== area)
        : [...form.focus_areas, area]
    )
  }

  function validateStep(currentStep: number, data: OnboardingFormInput = form): string | null {
    if (currentStep === 0) {
      if (form.business_name.trim().length < 2) return 'Enter your business name.'
      if (form.industry === 'other' && (!form.industry_other || form.industry_other.trim().length < 2)) {
        return 'Describe your industry.'
      }
      return null
    }

    if (currentStep === 1) {
      if (form.departments.length < 1) return 'Add at least one department.'
      if (form.has_shifts && form.shifts.length < 1) return 'Add a shift or turn off shift tracking.'
      return null
    }

    if (currentStep === 2) {
      if (!data.sells_products && !data.sells_services) return 'Select products, services, or both.'
      if (data.sells_products && data.product_categories.length < 1) return 'Add at least one product category.'
      if (data.sells_services && data.service_types.length < 1) return 'Add at least one service type.'
      return null
    }

    if (currentStep === 3) {
      if (data.focus_areas.length < 1) return 'Select at least one business priority.'
      return null
    }

    return null
  }

  function goNext() {
    const nextForm = step === 2 ? withParsedOfferings() : form
    if (step === 2) setForm(nextForm)

    const error = validateStep(step, nextForm)
    if (error) {
      toast.error(error)
      return
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit() {
    const submissionForm = withParsedOfferings()
    setForm(submissionForm)

    for (let i = 0; i < STEPS.length; i++) {
      const error = validateStep(i, submissionForm)
      if (error) {
        toast.error(error)
        setStep(i)
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionForm),
      })

      const payload = await response.json()
      if (!response.ok) {
        toast.error(payload?.error ?? 'Failed to create workspace')
        setSubmitting(false)
        return
      }

      localStorage.removeItem(FORM_DRAFT_KEY)
      toast.success('Your workspace is ready!')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Failed to create workspace. Please try again.')
      setSubmitting(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-secondary ai-panel rounded-2xl px-8 py-6">
          <Loader2 size={18} className="animate-spin" />
          Loading setup...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_8%,#c5a05914_0%,transparent_36%)]" />

      <header className="border-b border-border-primary bg-bg-primary/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Logo variant="mark" size="md" href="/" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Rig Base setup</p>
              <p className="text-xs text-text-tertiary">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <span className="text-xs text-text-tertiary tabular-nums">{progress}%</span>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-4">
          <div className="h-2 rounded-full bg-bg-tertiary border border-border-primary overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ai-panel rounded-2xl p-6 md:p-8"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">{STEPS[step].title}</h1>
            <p className="text-sm text-text-secondary mt-1">{STEPS[step].description}</p>
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Business name</label>
                <input
                  className={inputClass}
                  value={form.business_name}
                  onChange={(e) => updateForm('business_name', e.target.value)}
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className={labelClass}>Industry</label>
                <select
                  className={inputClass}
                  value={form.industry}
                  onChange={(e) => handleIndustryChange(e.target.value as BusinessIndustry)}
                >
                  {INDUSTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.industry === 'other' && (
                <div>
                  <label className={labelClass}>Describe your industry</label>
                  <input
                    className={inputClass}
                    value={form.industry_other ?? ''}
                    onChange={(e) => updateForm('industry_other', e.target.value)}
                    placeholder="e.g. Event management"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Business model</label>
                  <select
                    className={inputClass}
                    value={form.business_model}
                    onChange={(e) => updateForm('business_model', e.target.value as OnboardingFormInput['business_model'])}
                  >
                    {BUSINESS_MODEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Team size</label>
                  <select
                    className={inputClass}
                    value={form.team_size}
                    onChange={(e) => updateForm('team_size', e.target.value as OnboardingFormInput['team_size'])}
                  >
                    {TEAM_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Revenue model</label>
                <select
                  className={inputClass}
                  value={form.revenue_model}
                  onChange={(e) => updateForm('revenue_model', e.target.value as OnboardingFormInput['revenue_model'])}
                >
                  {REVENUE_MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Departments</label>
                <div className="flex gap-2 mb-3">
                  <input
                    className={inputClass}
                    value={departmentInput}
                    onChange={(e) => setDepartmentInput(e.target.value)}
                    placeholder="Add a department"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addDepartment()
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addDepartment}
                    aria-label="Add department"
                    className="px-3 rounded-lg border border-border-primary bg-bg-tertiary hover:bg-bg-elevated"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.departments.map((department) => (
                    <span
                      key={department}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-primary bg-bg-secondary text-sm"
                    >
                      {department}
                      <button
                        type="button"
                        onClick={() => removeDepartment(department)}
                        aria-label={`Remove ${department}`}
                        className="text-text-tertiary hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border-primary bg-bg-secondary/60 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_shifts}
                    onChange={(e) => {
                      const checked = e.target.checked
                      updateForm('has_shifts', checked)
                      if (checked && form.shifts.length === 0) addShift()
                    }}
                    className="rounded border-border-primary"
                  />
                  <span className="text-sm">We operate in shifts</span>
                </label>

                {form.has_shifts && (
                  <div className="mt-4 space-y-3">
                    {form.shifts.map((shift, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto] gap-2 items-center">
                        <input
                          className={inputClass}
                          value={shift.name}
                          onChange={(e) => updateShift(index, 'name', e.target.value)}
                          placeholder="Shift name"
                        />
                        <input
                          className={inputClass}
                          type="time"
                          value={shift.start}
                          onChange={(e) => updateShift(index, 'start', e.target.value)}
                        />
                        <input
                          className={inputClass}
                          type="time"
                          value={shift.end}
                          onChange={(e) => updateShift(index, 'end', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeShift(index)}
                          aria-label={`Remove ${shift.name}`}
                          className="text-text-tertiary hover:text-danger p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addShift}
                      className="text-sm text-accent hover:text-accent-hover inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> Add shift
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="rounded-xl border border-border-primary bg-bg-secondary/60 p-4 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sells_products}
                    onChange={(e) => updateForm('sells_products', e.target.checked)}
                  />
                  <span className="text-sm">We sell products</span>
                </label>
                <label className="rounded-xl border border-border-primary bg-bg-secondary/60 p-4 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.sells_services}
                    onChange={(e) => updateForm('sells_services', e.target.checked)}
                  />
                  <span className="text-sm">We deliver services</span>
                </label>
              </div>

              {form.sells_products && (
                <div>
                  <label className={labelClass}>Product categories</label>
                  <textarea
                    className={`${inputClass} min-h-[96px]`}
                    value={productCategoriesInput}
                    onChange={(e) => setProductCategoriesInput(e.target.value)}
                    onBlur={syncOfferingsToForm}
                    placeholder="Apparel, Electronics, Accessories"
                  />
                  <p className="text-xs text-text-tertiary mt-1">Separate categories with commas.</p>
                </div>
              )}

              {form.sells_services && (
                <div>
                  <label className={labelClass}>Service types</label>
                  <textarea
                    className={`${inputClass} min-h-[96px]`}
                    value={serviceTypesInput}
                    onChange={(e) => setServiceTypesInput(e.target.value)}
                    onBlur={syncOfferingsToForm}
                    placeholder="Consulting, Installation, Support"
                  />
                  <p className="text-xs text-text-tertiary mt-1">Separate service types with commas.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className={labelClass}>ERP modules</p>
                <p className="text-xs text-text-tertiary mb-3">Dashboard and Finance are always included.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'hr' as const, label: 'HR — employees, roles, shifts' },
                    { key: 'inventory' as const, label: 'Inventory — stock and categories' },
                    { key: 'supply_chain' as const, label: 'Supply chain — suppliers and procurement' },
                    { key: 'crm' as const, label: 'CRM — customers and retention' },
                  ].map((module) => (
                    <label
                      key={module.key}
                      className="rounded-xl border border-border-primary bg-bg-secondary/60 p-4 flex items-start gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.modules[module.key]}
                        onChange={(e) =>
                          updateForm('modules', { ...form.modules, [module.key]: e.target.checked })
                        }
                        className="mt-0.5"
                      />
                      <span className="text-sm">{module.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className={labelClass}>Top business priorities</p>
                <p className="text-xs text-text-tertiary mb-3">We use these to pick your dashboard metrics.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {FOCUS_AREA_OPTIONS.map((area) => {
                    const selected = form.focus_areas.includes(area)
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className={`text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                          selected
                            ? 'border-accent/50 bg-accent/10 text-text-primary'
                            : 'border-border-primary bg-bg-secondary/60 text-text-secondary hover:bg-bg-elevated'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {selected && <CheckCircle2 size={16} className="text-accent" />}
                          {area}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-accent/25 bg-accent/10 p-4 text-sm text-text-secondary">
                Submitting will create your custom dashboard metrics, enabled modules, roles, and setup checklist — saved to your account for future logins.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border-primary text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Create my workspace
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
