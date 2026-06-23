'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  LayoutDashboard,
  Package,
  Truck,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

type ModuleTile = {
  id: string
  label: string
  icon: LucideIcon
  summary: string
  features: string[]
}

const MODULES: ModuleTile[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    summary: 'Configurable KPIs tied to your enabled modules and reporting periods.',
    features: ['Time-period filters', 'Module-aware metrics', 'AI insight requests'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    summary: 'Revenue, expenses, and category reporting with import-ready ledgers.',
    features: ['Revenue vs expense', 'Category breakdown', 'CSV / JSON import'],
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: Users,
    summary: 'Employees, departments, roles, and shift-aware workforce structure.',
    features: ['Role permissions', 'Department mapping', 'Status tracking'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    summary: 'SKU management, stock levels, and low-stock signals across categories.',
    features: ['Stock alerts', 'Category filters', 'Bulk import'],
  },
  {
    id: 'supply_chain',
    label: 'Supply Chain',
    icon: Truck,
    summary: 'Suppliers, purchase orders, and procurement status in one pipeline.',
    features: ['Vendor records', 'PO lifecycle', 'Supplier filters'],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: UserCircle,
    summary: 'Customer records, lead stages, and interaction history for your team.',
    features: ['Lead tracking', 'Spend history', 'Status workflows'],
  },
]

export function ErpModuleGrid() {
  const [activeId, setActiveId] = useState(MODULES[0].id)
  const active = MODULES.find((m) => m.id === activeId) ?? MODULES[0]

  return (
    <section className="px-6 py-20 border-y border-border-primary/80 bg-bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 max-w-2xl">
          <p className="text-eyebrow mb-3">ERP modules</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
            Six operational domains. One connected system.
          </h2>
          <p className="text-sm text-text-secondary mt-3 leading-relaxed">
            Hover a module to inspect capabilities — each area shares the same workspace, permissions model, and data import tooling.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODULES.map((module) => {
              const Icon = module.icon
              const isActive = module.id === activeId
              return (
                <button
                  key={module.id}
                  type="button"
                  onMouseEnter={() => setActiveId(module.id)}
                  onFocus={() => setActiveId(module.id)}
                  className={`marketing-tile text-left rounded-xl border p-4 transition-all duration-300 ${
                    isActive
                      ? 'border-accent/50 bg-accent/10 shadow-[0_0_32px_rgba(37,99,235,0.15)] scale-[1.02]'
                      : 'border-border-primary bg-bg-secondary hover:border-border-secondary hover:bg-bg-tertiary/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300 ${
                      isActive ? 'bg-accent text-white' : 'bg-accent-muted text-accent'
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{module.label}</p>
                </button>
              )
            })}
          </div>

          <motion.div
            key={active.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="marketing-glass-panel-dark rounded-xl border border-border-primary p-6 lg:p-8 flex flex-col justify-center"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
                <active.icon size={20} className="text-accent" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">{active.label}</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">{active.summary}</p>
            <ul className="space-y-2">
              {active.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-text-secondary group/item"
                >
                  <span className="w-1 h-1 rounded-full bg-accent group-hover/item:scale-150 transition-transform duration-200" />
                  <span className="group-hover/item:text-text-primary transition-colors duration-200">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
