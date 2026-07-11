'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { BRAND_NAME, LOGO_MARK_SRC } from '@/lib/brand'
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from '@/lib/sidebar-layout'
import { useWorkspaceStore } from '@/store/workspace'

const LOGO_SIZE = 66
const LOGO_CROP = 1.28

const BRAND_BADGE_ROUTES = ['/dashboard/profile', '/dashboard/settings'] as const

export function DashboardBrand() {
  const pathname = usePathname()
  const { sidebarOpen } = useWorkspaceStore()
  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED
  const showBadge = BRAND_BADGE_ROUTES.includes(pathname as (typeof BRAND_BADGE_ROUTES)[number])

  if (!showBadge) return null

  return (
    <motion.div
      animate={{ left: sidebarWidth + 24 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-7 z-30 pointer-events-none"
    >
      <Link
        href="/dashboard"
        className="pointer-events-auto inline-flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border-primary bg-bg-secondary/90 backdrop-blur-sm shadow-sm group"
        aria-label={BRAND_NAME}
      >
        <span
          className="inline-flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
        >
          <img
            src={LOGO_MARK_SRC}
            alt=""
            aria-hidden
            decoding="async"
            className="max-w-none object-contain object-center"
            style={{
              width: Math.round(LOGO_SIZE * LOGO_CROP),
              height: Math.round(LOGO_SIZE * LOGO_CROP),
            }}
          />
        </span>
        <span className="font-serif font-medium text-sm text-text-primary tracking-tight group-hover:text-accent transition-colors duration-200">
          {BRAND_NAME}
        </span>
      </Link>
    </motion.div>
  )
}
