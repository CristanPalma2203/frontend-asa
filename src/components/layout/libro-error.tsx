import gsap from 'gsap'
import { useRef } from 'react'

import { useMotion } from '@/hooks/use-motion'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function LibroError({
  titulo,
  subtitulo,
  tono = 'oscuro',
  className,
}: {
  titulo: string
  subtitulo: string
  tono?: 'oscuro' | 'celeste'
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useMotion(ref, (root) => {
    if (prefersReducedMotion()) return
    const libro = root.querySelector('[data-libro]')
    const sombra = root.querySelector('[data-sombra]')
    gsap
      .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
      .to(libro, { y: -16, duration: 2.4 }, 0)
      .to(sombra, { scaleX: 0.78, opacity: 0.55, duration: 2.4 }, 0)
  })

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('libro-error', `libro-error--${tono}`, className)}
    >
      <span className="libro-error__brillo" />
      <div data-libro className="libro-error__flota">
        <div className="libro-error__tapa">
          <span className="libro-error__marco" />
          <span className="libro-error__titulo">{titulo}</span>
          <span className="libro-error__sub">{subtitulo}</span>
        </div>
      </div>
      <span data-sombra className="libro-error__sombra" />
    </div>
  )
}
