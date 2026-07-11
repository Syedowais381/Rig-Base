export async function fetchDefaultLandingRoute(): Promise<string> {
  const res = await fetch('/api/auth/landing-route', { cache: 'no-store' })
  if (!res.ok) return '/dashboard/profile'
  const payload = (await res.json()) as { route?: string }
  return payload.route ?? '/dashboard/profile'
}
