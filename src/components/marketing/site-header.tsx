'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { BrandMark } from '@/components/brand/brand-mark'

const NAV_LINKS = [
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#why-rig-base', label: 'Why Rig Base' },
] as const

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-6 pt-4 sm:pt-5 pointer-events-none">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-500 pointer-events-auto ${
          scrolled
            ? 'border border-white/10 bg-[#0a0a0a]/88 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]'
            : 'border border-white/5 bg-transparent backdrop-blur-[2px]'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 h-[4.75rem]">
          <Link href="/" className="flex items-center gap-3 sm:gap-4 min-w-0 shrink-0 group">
            <span className="flex items-center justify-center h-14 w-14 sm:h-[4.75rem] sm:w-[4.75rem] shrink-0">
              <Logo variant="mark" size="header" priority />
            </span>
            <div className="hidden sm:flex items-center min-w-0">
              <BrandMark variant="default" showPlatform={false} tone="light" wordmarkSize="lg" />
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            <nav className="hidden md:flex items-center" aria-label="Primary">
              <ul className="flex items-center gap-0.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="px-3 py-2 text-sm font-medium text-slate-300 rounded-lg hover:text-white hover:bg-white/8 transition-all duration-200 whitespace-nowrap"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <span className="hidden md:block w-px h-5 bg-white/10 mx-1" aria-hidden />

            <Link
              href="/auth/login"
              className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-sm font-medium text-slate-300 rounded-lg hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              Sign in
            </Link>
            <span className="hidden sm:block w-px h-5 bg-white/10" aria-hidden />
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-md text-[#0a0a0a] bg-accent hover:bg-accent-hover transition-all duration-300 shadow-[0_0_24px_rgba(197,160,89,0.2)]"
            >
              Get started
              <ArrowRight
                size={15}
                strokeWidth={2.25}
                className="hidden sm:block transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
