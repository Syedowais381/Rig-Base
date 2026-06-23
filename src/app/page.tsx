import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BarChart3, Boxes, Shield, Users } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ErpModuleGrid } from '@/components/marketing/erp-module-grid'
import { HeroErpPreview } from '@/components/marketing/hero-erp-preview'
import { SiteHeader } from '@/components/marketing/site-header'

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

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#070b12]" aria-hidden>
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
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-bg-primary to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 sm:pt-36 pb-20 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center">
            <div className="max-w-2xl">
              <p className="text-eyebrow mb-6 text-slate-400">Enterprise operations platform</p>

              <h1 className="text-display text-[clamp(2.35rem,5vw,3.85rem)] text-white mb-6">
                The operating system
                <br />
                for serious businesses.
              </h1>

              <p className="text-lead max-w-xl mb-3 text-slate-300">
                Rig Base delivers a structured workspace for{' '}
                <span className="text-emphasis text-white">finance</span>,{' '}
                <span className="text-emphasis text-white">inventory</span>,{' '}
                <span className="text-emphasis text-white">HR</span>,{' '}
                <span className="text-emphasis text-white">CRM</span>, and{' '}
                <span className="text-emphasis text-white">supply chain</span>
                — configured to your industry, not a generic template.
              </p>

              <p className="text-sm text-slate-400 mb-10 max-w-lg">
                Built for owners and operators who need clarity, control, and accountable reporting.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/auth/signup"
                  className="marketing-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-accent hover:bg-accent-hover"
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
            </div>

            <div className="hidden lg:flex justify-end">
              <HeroErpPreview />
            </div>
          </div>

          <div className="lg:hidden mt-12">
            <HeroErpPreview />
          </div>
        </div>
      </section>

      <ErpModuleGrid />

      <main id="capabilities" className="relative px-6 pb-20 pt-16 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <p className="text-eyebrow mb-3">Platform capabilities</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
              Everything required to run the business, in one place.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="marketing-card-hover group rounded-xl border border-border-primary bg-bg-secondary p-6 cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-muted border border-accent-subtle flex items-center justify-center mb-5 group-hover:bg-accent group-hover:border-accent transition-colors duration-300">
                  <item.icon
                    size={18}
                    className="text-accent group-hover:text-white transition-colors duration-300"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="font-semibold mb-2 text-[15px] text-text-primary tracking-tight group-hover:text-white transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                  {item.desc.split(item.highlight)[0]}
                  <span className="text-text-primary font-medium group-hover:text-white transition-colors duration-300">
                    {item.highlight}
                  </span>
                  {item.desc.split(item.highlight)[1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <section id="why-rig-base" className="px-6 pb-20 scroll-mt-32">
        <div className="max-w-7xl mx-auto rounded-xl border border-border-primary bg-bg-secondary p-8 md:p-10 marketing-card-hover">
          <p className="text-eyebrow mb-6">Why Rig Base</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {WHY_STEPS.map((item) => (
              <div
                key={item.step}
                className="marketing-step-hover rounded-lg border-l-2 border-accent/40 pl-5 py-4 pr-2"
              >
                <p className="text-xs font-mono font-medium text-accent mb-2">{item.step}</p>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto rounded-xl border border-accent/25 bg-accent/5 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-eyebrow mb-2 text-accent">Ready to operate</p>
            <h2 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
              Configure your ERP workspace in minutes.
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-lg">
              Guided setup, module selection, and role configuration — then import your data and run.
            </p>
          </div>
          <Link
            href="/auth/signup"
            className="marketing-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold text-white bg-accent hover:bg-accent-hover shrink-0"
          >
            Start free setup
            <ArrowRight size={16} strokeWidth={2.25} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border-primary py-8 bg-bg-secondary/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-tertiary">
          <Logo variant="mark" size="md" />
          <span>Enterprise operations. No compromise on clarity.</span>
        </div>
      </footer>
    </div>
  )
}
