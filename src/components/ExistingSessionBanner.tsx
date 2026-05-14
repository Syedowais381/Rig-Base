'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/** Shown on login/signup when a session cookie already exists (e.g. partial onboarding). */
export function ExistingSessionBanner() {
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email
      if (e) setEmail(e)
    })
  }, [])

  if (!email) return null

  async function signOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setEmail(null)
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-left">
      <p className="text-text-secondary">
        You&apos;re already signed in as{' '}
        <span className="text-text-primary font-medium">{email}</span>.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
        >
          Continue to app
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => void signOut()}
          className="inline-flex items-center rounded-md border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-50"
        >
          {busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
      <p className="mt-2 text-xs text-text-tertiary">
        Use Sign out if you meant to use a different email or create a new account.
      </p>
    </div>
  )
}
