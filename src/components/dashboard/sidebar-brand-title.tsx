'use client'

import { BrandMark } from '@/components/brand/brand-mark'

export function SidebarBrandTitle() {
  return <BrandMark variant="sidebar" href="/dashboard" />
}

export function SidebarBrandCollapsed() {
  return <BrandMark variant="collapsed" href="/dashboard" />
}
