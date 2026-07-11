'use client'

import Link from 'next/link'
import { BRAND_NAME } from '@/lib/brand'

export function SidebarBrandTitle() {
  return (
    <div className="relative shrink-0 border-b border-border-primary overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, transparent 55%, rgba(197, 160, 89, 0.03) 100%)',
        }}
      />
      <Link
        href="/dashboard"
        className="relative block px-4 py-5 group text-center"
        aria-label={BRAND_NAME}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-accent/50" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-accent shrink-0">
            Platform
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-accent/50" />
        </div>
        <p className="font-serif text-[1.375rem] font-medium leading-none tracking-tight text-text-primary text-center">
          Rig{' '}
          <span className="text-accent group-hover:text-accent-hover transition-colors duration-300">
            Base
          </span>
        </p>
        <div className="mt-3 mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </Link>
    </div>
  )
}

export function SidebarBrandCollapsed() {
  return (
    <div className="relative shrink-0 border-b border-border-primary overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, rgba(197, 160, 89, 0.08) 0%, transparent 55%, rgba(197, 160, 89, 0.03) 100%)',
        }}
      />
      <Link
        href="/dashboard"
        className="relative flex flex-col items-center justify-center py-4 px-1 group"
        aria-label={BRAND_NAME}
      >
        <p className="font-serif text-xl font-medium leading-none tracking-wide text-text-primary">
          R
          <span className="text-accent group-hover:text-accent-hover transition-colors duration-300">
            B
          </span>
        </p>
        <div className="mt-2.5 h-px w-8 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </Link>
    </div>
  )
}
