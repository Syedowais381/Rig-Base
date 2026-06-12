import Link from 'next/link'
import { ArrowRight, Boxes, Brain, Shield, Sparkles, Radar, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,#3d8bff22_0%,transparent_40%),radial-gradient(circle_at_85%_20%,#836dff1e_0%,transparent_32%)]" />
      <header className="sticky top-0 z-20 border-b border-border-primary/80 bg-bg-primary/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent to-cyan-glow ai-glow">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <span className="text-base font-semibold tracking-wide">Rig Base</span>
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary">AI Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary">
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-accent to-[#3172ff] hover:from-accent-hover hover:to-[#4285ff] ai-glow"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pt-16 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-stretch mb-16">
            <section className="ai-panel rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-[#3d8bff24] blur-3xl" />
              <div className="inline-flex items-center gap-2 px-3 py-1 ai-pill rounded-full text-cyan-glow text-xs mb-8">
                <Brain size={14} />
                AI-powered ERP built for your business
              </div>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.05]">
                The future
                <br />
                of enterprise
                <br />
                <span className="bg-gradient-to-r from-[#74b3ff] via-cyan-glow to-[#b29bff] bg-clip-text text-transparent">
                  operations intelligence
                </span>
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mb-10">
                Rig Base builds a personalized management platform for your company through a guided setup form.
                Launch a complete business command center tuned to your industry, team, and priorities.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-accent to-[#3172ff] hover:to-[#4990ff] ai-glow"
                >
                  Launch your workspace
                  <ArrowRight size={18} />
                </Link>
                <Link href="/auth/login" className="text-sm text-text-secondary hover:text-text-primary">
                  Continue setup
                </Link>
              </div>
            </section>

            <section className="ai-card rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary mb-5">System Activity</p>
                <div className="space-y-4">
                  {[
                    ['AI Orchestration', 'Optimizing business modules'],
                    ['Workflow Engine', 'Generating intelligent automations'],
                    ['Data Grid', 'Sync healthy across departments'],
                  ].map(([title, value]) => (
                    <div key={title} className="rounded-xl border border-border-primary bg-bg-secondary/70 px-4 py-3">
                      <p className="text-xs text-text-tertiary">{title}</p>
                      <p className="text-sm font-medium mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-border-primary">
                <p className="text-sm text-text-secondary">All core operations from one AI-native cockpit.</p>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="ai-card rounded-2xl p-6">
              <div className="w-11 h-11 bg-accent-muted rounded-xl flex items-center justify-center mb-4">
                <Brain size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2">AI-Personalized</h3>
              <p className="text-sm text-text-secondary">Every module, metric, and workflow adapts to your company profile.</p>
            </div>
            <div className="ai-card rounded-2xl p-6">
              <div className="w-11 h-11 bg-accent-muted rounded-xl flex items-center justify-center mb-4">
                <Boxes size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Unified ERP Core</h3>
              <p className="text-sm text-text-secondary">Finance, HR, inventory, CRM, and supply chain in one integrated surface.</p>
            </div>
            <div className="ai-card rounded-2xl p-6">
              <div className="w-11 h-11 bg-accent-muted rounded-xl flex items-center justify-center mb-4">
                <Shield size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Enterprise-Grade Access</h3>
              <p className="text-sm text-text-secondary">Granular roles and visibility keep every team focused and secure.</p>
            </div>
            <div className="ai-card rounded-2xl p-6">
              <div className="w-11 h-11 bg-accent-muted rounded-xl flex items-center justify-center mb-4">
                <Radar size={20} className="text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Live Intelligence Loop</h3>
              <p className="text-sm text-text-secondary">An always-on AI layer surfaces actions, risks, and growth opportunities.</p>
            </div>
          </div>
        </div>
      </main>

      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto ai-panel rounded-3xl p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[
            { icon: Sparkles, title: 'Adaptive Workspace', desc: 'Continuously evolves with your business context.' },
            { icon: Zap, title: 'Fast Command Layer', desc: 'Move across modules with smooth operational flow.' },
            { icon: Brain, title: 'Cognitive Assistance', desc: 'AI responses with confidence and business structure.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border-primary bg-bg-secondary/60 p-5">
              <item.icon size={18} className="text-cyan-glow mb-3" />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-text-secondary mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-primary py-6 bg-bg-primary/60">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-text-tertiary">
          Rig Base - Built for your business, by AI.
        </div>
      </footer>
    </div>
  )
}
