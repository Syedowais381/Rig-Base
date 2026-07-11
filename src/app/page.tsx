import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, BarChart3, Boxes, ChevronDown, Shield, Sparkles, Users } from 'lucide-react'
import { BrandMark } from '@/components/brand/brand-mark'
import { ErpModuleGrid } from '@/components/marketing/erp-module-grid'
import { HeroErpPreview } from '@/components/marketing/hero-erp-preview'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'

const HERO_BG_IMAGE = '/images/hero-bg.png'

const CAPABILITIES = [
  {
    icon: BarChart3,
    title: 'Operational visibility',
    desc: 'Dashboards and metrics aligned to how your business measures performance.',
    highlight: 'Dashboards and metrics',
  },
  {
    icon: Boxes,
    title: 'Integrated ERP core',
    desc: 'Finance, inventory, HR, CRM, and supply chain in one controlled workspace.',
    highlight: 'Finance, inventory, HR, CRM, and supply chain',
  },
  {
    icon: Shield,
    title: 'Governed access',
    desc: 'Role-based permissions that keep teams focused and data protected.',
    highlight: 'Role-based permissions',
  },
  {
    icon: Users,
    title: 'Executive insights',
    desc: 'Request AI analysis on demand — grounded in your live operational data.',
    highlight: 'AI analysis on demand',
  },
]

const WHY_STEPS = [
  {
    step: '01',
    title: 'Structured onboarding',
    desc: 'Capture your business profile through a disciplined setup process — departments, modules, and KPIs defined upfront.',
  },
  {
    step: '02',
    title: 'Operational discipline',
    desc: 'Search, filters, imports, and module workflows designed for day-to-day execution, not demos.',
  },
  {
    step: '03',
    title: 'Informed decisions',
    desc: 'Monitor performance with period-aware metrics and request executive AI guidance when you need it.',
  },
]

const TRUST_MODULES = ['Finance', 'Inventory', 'HR', 'CRM', 'Supply Chain']

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="h-px w-8 bg-gradient-to-r from-accent/70 to-transparent" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">{children}</p>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <SiteHeader />

      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0a]" aria-hidden>
          <Image
            src={HERO_BG_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 hero-bg-image-overlay" aria-hidden />
        <div className="absolute inset-0 hero-bg-glow" aria-hidden />
        <div className="absolute inset-0 hero-bg-grid opacity-60" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 sm:pt-36 pb-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">
            <div className="max-w-2xl">
              <div className="mb-8">
                <BrandMark variant="hero" href="/" tone="light" showPlatform />
              </div>

              <h1 className="hero-headline text-display text-[clamp(2.35rem,5vw,3.85rem)] text-white mb-5">
                <span className="block whitespace-nowrap">
                  The <span className="text-accent">operating system</span>
                </span>
                <span className="block">
                  for <span className="text-accent">serious</span>
                </span>
                <span className="block text-white/90">businesses.</span>
              </h1>
              <div className="h-px w-20 bg-gradient-to-r from-accent/70 to-transparent mb-7" aria-hidden />

              <p className="text-lead max-w-xl mb-3">
                A structured workspace for{' '}
                <span className="text-accent font-medium">finance</span>,{' '}
                <span className="text-accent font-medium">inventory</span>,{' '}
                <span className="text-accent font-medium">HR</span>,{' '}
                <span className="text-accent font-medium">CRM</span>, and{' '}
                <span className="text-accent font-medium">supply chain</span>
                — configured to your industry, not a generic template.
              </p>

              <p className="text-sm text-text-tertiary mb-8 max-w-lg leading-relaxed">
                Built for owners and operators who need clarity, control, and accountable reporting.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="marketing-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-md text-sm font-semibold text-[#0a0a0a] bg-accent hover:bg-accent-hover shadow-[0_0_32px_rgba(197,160,89,0.25)]"
                >
                  Launch your workspace
                  <ArrowRight size={16} strokeWidth={2.25} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center px-2 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors duration-200"
                >
                  Sign in to existing account
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
                {TRUST_MODULES.map((mod) => (
                  <span
                    key={mod}
                    className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03] tracking-wide"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex justify-end">
              <HeroErpPreview />
            </div>
          </div>

          <div className="lg:hidden mt-12">
            <HeroErpPreview />
          </div>

          <div className="hidden lg:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-text-tertiary/60">
            <span className="text-[10px] uppercase tracking-[0.2em]">Explore</span>
            <ChevronDown size={14} className="animate-bounce" />
          </div>
        </div>
      </section>

      <ErpModuleGrid />

      <main id="capabilities" className="relative px-6 py-24 scroll-mt-32 bg-bg-primary">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <SectionEyebrow>Platform capabilities</SectionEyebrow>
            <h2 className="font-serif text-2xl sm:text-[2rem] font-medium tracking-tight text-text-primary leading-tight">
              Everything required to run the business,
              <span className="text-accent"> in one place.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="marketing-card-premium group rounded-xl border border-border-primary bg-bg-secondary/80 p-6 cursor-default relative overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/60 transition-all duration-500" />
                <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent-subtle flex items-center justify-center mb-5 group-hover:bg-accent group-hover:border-accent transition-colors duration-300">
                  <item.icon
                    size={18}
                    className="text-accent group-hover:text-white transition-colors duration-300"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="font-semibold mb-2 text-[15px] text-text-primary tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc.split(item.highlight)[0]}
                  <span className="text-text-primary font-medium">{item.highlight}</span>
                  {item.desc.split(item.highlight)[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section id="why-rig-base" className="px-6 pb-24 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl border border-border-primary bg-bg-secondary/60 p-8 md:p-12 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              aria-hidden
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 100% 0%, rgba(197, 160, 89, 0.12) 0%, transparent 60%)',
              }}
            />
            <div className="relative">
              <SectionEyebrow>Why Rig Base</SectionEyebrow>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                {WHY_STEPS.map((item, index) => (
                  <div
                    key={item.step}
                    className="marketing-step-premium relative rounded-xl border border-border-primary/80 bg-bg-primary/40 p-6"
                  >
                    {index < WHY_STEPS.length - 1 && (
                      <span
                        className="hidden lg:block absolute top-10 -right-5 w-10 h-px bg-gradient-to-r from-accent/40 to-transparent"
                        aria-hidden
                      />
                    )}
                    <p className="text-xs font-mono font-medium text-accent mb-3">{item.step}</p>
                    <h3 className="text-base font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto marketing-cta-panel rounded-2xl border border-accent/30 p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                'linear-gradient(135deg, rgba(197, 160, 89, 0.1) 0%, transparent 50%, rgba(197, 160, 89, 0.05) 100%)',
            }}
          />
          <div className="relative max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-[10px] font-semibold uppercase tracking-[0.18em] mb-4">
              <Sparkles size={12} />
              Ready to operate
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary tracking-tight">
              Configure your ERP workspace in minutes.
            </h2>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              Guided setup, module selection, and role configuration — then import your data and run.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="relative shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-md text-sm font-semibold text-[#0a0a0a] bg-accent hover:bg-accent-hover shadow-[0_0_28px_rgba(197,160,89,0.3)]"
          >
            Start free setup
            <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
