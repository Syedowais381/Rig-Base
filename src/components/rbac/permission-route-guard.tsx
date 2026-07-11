'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { getModuleFromPathname } from '@/lib/rbac/module-access'

export function PermissionRouteGuard() {
  const pathname = usePathname()
  const router = useRouter()
  const { canViewModule, defaultLandingRoute, isLoading } = usePermissions()

  useEffect(() => {
    if (isLoading) return

    const module = getModuleFromPathname(pathname)
    if (!module) return
    if (canViewModule(module)) return

    if (pathname !== defaultLandingRoute) {
      router.replace(defaultLandingRoute)
    }
  }, [pathname, canViewModule, defaultLandingRoute, isLoading, router])

  return null
}
