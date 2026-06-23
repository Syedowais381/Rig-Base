'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  LayoutDashboard,
  MonitorPlay,
  Package,
  Truck,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react'

type ErpModule = {
  id: string
  label: string
  icon: LucideIcon
  headline: string
  metrics: { label: string; value: string; trend?: string }[]
  activity: string
}

const ERP_MODULES: ErpModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    headline: 'Executive KPIs at a glance',
    metrics: [
      { label: 'Revenue MTD', value: '$284K', trend: '+12.4%' },
      { label: 'Open POs', value: '18', trend: '3 due today' },
    ],
    activity: 'Sample data · 8 metrics · This month',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    headline: 'Ledger & cash flow control',
    metrics: [
      { label: 'Net margin', value: '32.1%', trend: '+2.1 pts' },
      { label: 'Expenses MTD', value: '$192K', trend: 'On budget' },
    ],
    activity: 'Sample data · 14 transactions shown',
  },
  {
    id: 'hr',
    label: 'HR',
    icon: Users,
    headline: 'Workforce & role governance',
    metrics: [
      { label: 'Active staff', value: '47', trend: '2 on leave' },
      { label: 'Departments', value: '6', trend: 'All staffed' },
    ],
    activity: 'Sample data · roles & departments',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    headline: 'Stock levels & reorder signals',
    metrics: [
      { label: 'SKUs tracked', value: '312', trend: '8 low stock' },
      { label: 'Stock value', value: '$1.2M', trend: '+4.2%' },
    ],
    activity: 'Sample data · stock & categories',
  },
  {
    id: 'supply_chain',
    label: 'Supply Chain',
    icon: Truck,
    headline: 'Procurement & vendor pipeline',
    metrics: [
      { label: 'Active suppliers', value: '24', trend: 'All verified' },
      { label: 'POs in transit', value: '5', trend: '2 arriving' },
    ],
    activity: 'Sample data · PO #PO-1042 approved',
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: UserCircle,
    headline: 'Customer pipeline & retention',
    metrics: [
      { label: 'Active accounts', value: '156', trend: '+9 this month' },
      { label: 'Pipeline value', value: '$890K', trend: '12 open leads' },
    ],
    activity: 'Sample data · 4 follow-ups today',
  },
]

const PANEL_EASE = [0.22, 1, 0.36, 1] as const
const CLOSE_DELAY_MS = 420

export function HeroErpPreview() {
  const [expanded, setExpanded] = useState(false)
  const [activeId, setActiveId] = useState(ERP_MODULES[0].id)
  const [paused, setPaused] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = ERP_MODULES.find((m) => m.id === activeId) ?? ERP_MODULES[0]

  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none)').matches)
  }, [])

  useEffect(() => {
    if (!expanded || paused) return
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const index = ERP_MODULES.findIndex((m) => m.id === current)
        return ERP_MODULES[(index + 1) % ERP_MODULES.length].id
      })
    }, 4500)
    return () => window.clearInterval(timer)
  }, [expanded, paused])

  function openPreview() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setExpanded(true)
  }

  function scheduleClose() {
    if (isTouch) return
    closeTimer.current = setTimeout(() => setExpanded(false), CLOSE_DELAY_MS)
  }

  return (
    <div
      data-expanded={expanded ? 'true' : 'false'}
      onMouseEnter={() => {
        if (isTouch) return
        openPreview()
      }}
      onMouseLeave={() => {
        if (isTouch) return
        setPaused(false)
        scheduleClose()
      }}
      className={`hero-preview-shell w-full ${
        expanded
          ? 'max-w-md shadow-[0_28px_90px_rgba(0,0,0,0.55)]'
          : 'max-w-[19rem] shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
      }`}
    >
      <div
        className={`marketing-glass-panel w-full rounded-2xl border overflow-hidden transition-[border-color,box-shadow] duration-500 ${
          expanded
            ? 'border-white/14'
            : 'border-white/10 hover:border-accent/35 hover:shadow-[0_0_40px_rgba(37,99,235,0.18)]'
        }`}
      >
        <button
          type="button"
          onClick={() => isTouch && setExpanded((v) => !v)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 ${
            expanded ? 'border-b border-white/8 bg-white/[0.03]' : 'group'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              expanded
                ? 'bg-accent/15 border border-accent/25 scale-100'
                : 'bg-accent/15 border border-accent/30 group-hover:bg-accent group-hover:border-accent group-hover:scale-[1.04]'
            }`}
          >
            <MonitorPlay
              size={18}
              className={`transition-colors duration-300 ${expanded ? 'text-accent' : 'text-accent group-hover:text-white'}`}
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Preview workspace</p>
            <p className="text-xs text-slate-400 mt-0.5 transition-colors duration-300">
              {expanded
                ? 'Sample ERP data · no login required'
                : isTouch
                  ? 'Tap to enlarge'
                  : 'Hover to enlarge preview'}
            </p>
          </div>
          <span className="hero-preview-badge text-[10px] font-medium text-accent uppercase tracking-wide shrink-0">
            Demo
          </span>
        </button>

        <div
          className="hero-preview-expand"
          data-expanded={expanded ? 'true' : 'false'}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="hero-preview-expand-inner">
            <div className="hero-preview-body">
              <div className="p-3 border-b border-white/8">
                <div className="flex flex-wrap gap-1.5">
                  {ERP_MODULES.map((module) => {
                    const Icon = module.icon
                    const isActive = module.id === activeId
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onMouseEnter={() => setActiveId(module.id)}
                        onFocus={() => setActiveId(module.id)}
                        onClick={() => setActiveId(module.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-accent text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/8'
                        }`}
                      >
                        <Icon size={12} strokeWidth={2.25} />
                        {module.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: PANEL_EASE }}
                  className="p-5"
                >
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
                      <active.icon size={18} className="text-accent" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{active.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{active.headline}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {active.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5 hover:border-accent/30 hover:bg-accent/5 transition-colors duration-300"
                      >
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{metric.label}</p>
                        <p className="text-lg font-semibold text-white mt-1 tabular-nums">{metric.value}</p>
                        {metric.trend && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{metric.trend}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 border-t border-white/8 pt-3">{active.activity}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
