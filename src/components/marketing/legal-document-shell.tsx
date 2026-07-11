import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'

type LegalDocumentShellProps = {
  title: string
  updated: string
  children: ReactNode
}

export function LegalDocumentShell({ title, updated, children }: LegalDocumentShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <SiteHeader />
      <main className="flex-1 px-6 pt-32 pb-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent mb-3">Legal</p>
          <h1 className="font-serif text-3xl font-medium text-text-primary tracking-tight mb-2">{title}</h1>
          <p className="text-sm text-text-muted mb-10">Last updated: {updated}</p>
          <div className="prose-legal space-y-6 text-sm text-text-secondary leading-relaxed">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
