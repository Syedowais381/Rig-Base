import Link from 'next/link'
import { ArrowRight, Boxes, Brain, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-primary">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold">Rig Base</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-muted border border-accent/20 rounded-full text-accent text-sm mb-8">
            <Brain size={14} />
            AI-powered ERP built for your business
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Your business.
            <br />
            <span className="text-accent">Your system.</span>
          </h1>

          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10">
            Rig Base builds a completely unique management platform for your business
            through a single AI conversation. No two systems are the same.
          </p>

          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors"
          >
            Build your system
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-24">
          <div className="p-6 bg-bg-secondary border border-border-primary rounded-xl">
            <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center mb-4">
              <Brain size={20} className="text-accent" />
            </div>
            <h3 className="font-semibold mb-2">AI-Personalized</h3>
            <p className="text-sm text-text-secondary">
              Every module, metric, and workflow is built from what you tell the AI about your business.
            </p>
          </div>

          <div className="p-6 bg-bg-secondary border border-border-primary rounded-xl">
            <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center mb-4">
              <Boxes size={20} className="text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Complete ERP</h3>
            <p className="text-sm text-text-secondary">
              Dashboard, HR, Inventory, Finance, Supply Chain, and CRM — only the modules you need.
            </p>
          </div>

          <div className="p-6 bg-bg-secondary border border-border-primary rounded-xl">
            <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center mb-4">
              <Shield size={20} className="text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Role-Based Access</h3>
            <p className="text-sm text-text-secondary">
              Granular permissions for every team member. Everyone sees exactly what they need.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border-primary py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-text-tertiary">
          Rig Base — Built for your business, by AI.
        </div>
      </footer>
    </div>
  )
}
