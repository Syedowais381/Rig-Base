'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { BRAND_NAME, LOGO_FULL_SRC, LOGO_MARK_SRC } from '@/lib/brand'

/** Slight zoom to crop built-in transparent padding — keep modest to avoid upscaling blur */
const LOGO_ZOOM = 1.14

/** Minimum source pixels requested from the optimizer (retina-safe) */
const LOGO_MIN_SRC_PX = 256

type LogoVariant = 'mark' | 'full'
type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | 'header'

/** Square logo sizes — both logo.png and logo-mark.png are treated as square assets. */
const sizeMap: Record<LogoSize, { mark: number; full: number }> = {
  sm: { mark: 40, full: 48 },
  md: { mark: 48, full: 56 },
  lg: { mark: 56, full: 72 },
  xl: { mark: 64, full: 96 },
  /** Larger mark for fixed nav — fits within h-[4.75rem] header bar */
  header: { mark: 86, full: 90 },
}

interface LogoProps {
  variant?: LogoVariant
  size?: LogoSize
  href?: string
  priority?: boolean
  showName?: boolean
  /** Sidebar/header: crisp native render, no zoom crop */
  compact?: boolean
  className?: string
}

function LogoFallback({
  variant,
  size,
  showName,
}: {
  variant: LogoVariant
  size: LogoSize
  showName?: boolean
}) {
  const px = variant === 'mark' ? sizeMap[size].mark : sizeMap[size].full

  const mark = (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-accent text-white font-bold shrink-0"
      style={{ width: px, height: px, fontSize: px * 0.36 }}
    >
      {BRAND_NAME.charAt(0)}
    </span>
  )

  if (variant === 'full' && showName) {
    return (
      <span className="inline-flex items-center gap-3">
        {mark}
        <span className="font-semibold tracking-tight text-text-primary text-base">{BRAND_NAME}</span>
      </span>
    )
  }

  return mark
}

export function Logo({
  variant = 'full',
  size = 'md',
  href,
  priority = false,
  showName = false,
  compact = false,
  className = '',
}: LogoProps) {
  const [failed, setFailed] = useState(false)
  const px = variant === 'mark' ? sizeMap[size].mark : sizeMap[size].full
  const src = variant === 'mark' ? LOGO_MARK_SRC : LOGO_FULL_SRC
  const renderSize = compact ? px : Math.round(px * LOGO_ZOOM)
  const intrinsicSize = compact ? px * 2 : Math.max(renderSize * 2, LOGO_MIN_SRC_PX)

  const image = compact ? (
    <span
      className="inline-flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: px, height: px }}
    >
      {/* Native img for sidebar — avoids scaling blur from layout zoom */}
      <img
        src={src}
        alt={BRAND_NAME}
        width={px}
        height={px}
        className="object-contain object-center"
        style={{ width: px, height: px }}
      />
    </span>
  ) : (
    <span
      className="inline-flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt={BRAND_NAME}
        width={intrinsicSize}
        height={intrinsicSize}
        sizes={`${renderSize}px`}
        quality={100}
        unoptimized
        priority={priority}
        onError={() => setFailed(true)}
        className="object-contain object-center max-w-none"
        style={{
          width: renderSize,
          height: renderSize,
          minWidth: renderSize,
          minHeight: renderSize,
        }}
      />
    </span>
  )

  const content = failed ? (
    <LogoFallback variant={variant} size={size} showName={showName} />
  ) : variant === 'full' && showName ? (
    <span className="inline-flex items-center gap-3">
      {image}
      <span className="font-semibold tracking-tight text-text-primary text-base whitespace-nowrap">{BRAND_NAME}</span>
    </span>
  ) : showName ? (
    <span className="inline-flex items-center gap-2.5 min-w-0">
      {image}
      <span className="font-semibold tracking-tight text-text-primary text-sm whitespace-nowrap truncate">{BRAND_NAME}</span>
    </span>
  ) : (
    image
  )

  const wrapperClass = `inline-flex items-center ${className}`

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label={BRAND_NAME}>
        {content}
      </Link>
    )
  }

  return <span className={wrapperClass}>{content}</span>
}
