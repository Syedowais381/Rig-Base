'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Shield, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/logo'

type InviteDetails = {
  employee_name: string
  email: string
  business_name: string
  business_type: string
  role_name: string
}

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const router = useRouter()
  const supabase = createClient()

  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [verificationPending, setVerificationPending] = useState(false)

  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    fetch(`/api/invites/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Invite not found')
        return res.json()
      })
      .then((data: InviteDetails) => {
        setInvite(data)
        setFullName(data.employee_name)
      })
      .catch(() => setInvite(null))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setSessionChecked(true)
    })
  }, [supabase.auth])

  async function acceptInvite() {
    setAccepting(true)
    const res = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const payload = await res.json().catch(() => ({}))
    setAccepting(false)

    if (!res.ok) {
      toast.error(payload.error ?? 'Failed to accept invite')
      return false
    }

    toast.success('Welcome to the team!')
    router.push('/dashboard')
    router.refresh()
    return true
  }

  useEffect(() => {
    if (sessionChecked && isLoggedIn && invite && token && !verificationPending) {
      acceptInvite()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked, isLoggedIn, invite, token, verificationPending])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const redirectUrl = `${window.location.origin}/auth/callback?invite=${encodeURIComponent(token)}`

    const { data, error } = await supabase.auth.signUp({
      email: invite!.email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          business_name: invite!.business_name,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    if (data.user && !data.session) {
      setVerificationPending(true)
      setSubmitting(false)
      toast.success('Verification email sent. Check your inbox to continue.')
      return
    }

    const accepted = await acceptInvite()
    if (!accepted) setSubmitting(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: invite!.email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    await acceptInvite()
    setSubmitting(false)
  }

  if (loading || (sessionChecked && isLoggedIn && !verificationPending)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    )
  }

  if (!token || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-2xl font-medium mb-2">Invite not found</h1>
          <p className="text-text-secondary text-sm mb-6">
            This invite link is invalid or has already been used. Ask your administrator to send a new one.
          </p>
          <Link href="/auth/login" className="text-accent hover:text-accent-hover">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (verificationPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 border border-border-primary flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={24} className="text-accent" />
          </div>
          <h1 className="font-serif text-2xl font-medium mb-2">Verify your email</h1>
          <p className="text-text-secondary text-sm mb-4">
            We sent a verification link to <strong>{invite.email}</strong>.
          </p>
          <p className="text-text-tertiary text-sm mb-6">
            After you verify, you&apos;ll be signed in and joined to {invite.business_name} automatically.
          </p>
          <p className="text-xs text-text-muted">
            Didn&apos;t receive it? Check spam or ask your administrator to resend the workspace invite.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,#c5a05912_0%,transparent_40%)]" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="full" size="xl" href="/" className="justify-center mb-8" />
          <h1 className="font-serif text-2xl font-medium mb-2">You&apos;re invited</h1>
          <p className="text-text-secondary">Join {invite.business_name} on Rig Base</p>
        </div>

        <div className="ai-card border border-border-primary p-6 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-accent shrink-0" />
            <div>
              <p className="text-sm font-medium">{invite.business_name}</p>
              <p className="text-xs text-text-tertiary">{invite.business_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-accent shrink-0" />
            <div>
              <p className="text-sm font-medium">{invite.role_name}</p>
              <p className="text-xs text-text-tertiary">Your assigned role</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-accent shrink-0" />
            <div>
              <p className="text-sm font-medium">{invite.email}</p>
              <p className="text-xs text-text-tertiary">Invite sent to this email</p>
            </div>
          </div>
        </div>

        <div className="border border-border-primary p-6">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                mode === 'signup'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border-primary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Create Account & Join
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                mode === 'login'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border-primary text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Log In & Join
            </button>
          </div>

          <form onSubmit={mode === 'signup' ? handleSignup : handleLogin} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-field"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input type="email" required value={invite.email} disabled className="form-field opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-field"
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || accepting}
              className="w-full form-submit flex items-center justify-center gap-2"
            >
              {(submitting || accepting) && <Loader2 size={18} className="animate-spin" />}
              {mode === 'signup' ? 'Create Account & Join' : 'Log In & Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}
