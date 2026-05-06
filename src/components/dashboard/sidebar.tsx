'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  Truck,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

const moduleIcons: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  hr: Users,
  inventory: Package,
  finance: DollarSign,
  supply_chain: Truck,
  crm: UserCircle,
}

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  hr: 'HR',
  inventory: 'Inventory',
  finance: 'Finance',
  supply_chain: 'Supply Chain',
  crm: 'CRM',
}

const moduleRoutes: Record<string, string> = {
  dashboard: '/dashboard',
  hr: '/dashboard/hr',
  inventory: '/dashboard/inventory',
  finance: '/dashboard/finance',
  supply_chain: '/dashboard/supply-chain',
  crm: '/dashboard/crm',
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { workspace, profile, sidebarOpen, toggleSidebar } = useWorkspaceStore()
  const supabase = createClient()

  const activeModules = workspace?.modules
    ? Object.entries(workspace.modules)
        .filter(([, active]) => active)
        .map(([key]) => key)
    : ['dashboard']

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 64 }}
      className="fixed left-0 top-0 h-screen bg-bg-secondary border-r border-border-primary flex flex-col z-20"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border-primary">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">R</span>
        </div>
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-semibold text-sm"
          >
            Rig Base
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {activeModules.map((module) => {
          const Icon = moduleIcons[module] || LayoutDashboard
          const route = moduleRoutes[module]
          const isActive = pathname === route || (module !== 'dashboard' && pathname.startsWith(route))

          return (
            <Link
              key={module}
              href={route}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
                />
              )}
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium">{moduleLabels[module]}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-primary p-2 space-y-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
        >
          <Settings size={20} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Settings</span>}
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Sign out</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 text-text-tertiary hover:text-text-secondary transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {sidebarOpen && profile && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-text-tertiary truncate">{profile.business_name}</p>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
