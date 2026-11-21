import * as DialogPrimitive from '@radix-ui/react-dialog'
import gsap from 'gsap'
import { X } from 'lucide-react'
import * as React from 'react'

import { dialogoEntra, dialogoSale, dur } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** `open` del Dialog para que DialogContent sepa cuándo entrar y cuándo salir (GSAP). */
const AbiertoContext = React.createContext(false)

function Dialog({
  open = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return (
    <AbiertoContext.Provider value={open}>
      <DialogPrimitive.Root data-slot="dialog" open={open} {...props} />
    </AbiertoContext.Provider>
  )
}

function DialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>,
) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>,
) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'bg-pino-950/45 fixed inset-0 z-50 backdrop-blur-[2px]',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Contenido del diálogo con entrada y salida animadas (lib/motion.ts): entra con
 * {opacity 0, y −14, scale 0.97} → 0.38 s back.out(1.6) y sale {opacity 0, y −8} 0.16 s power2.in.
 * Para que la salida se vea, el contenido sigue montado (forceMount) hasta que termina el tween;
 * el desmontaje va en su onComplete, no en un efecto.
 */
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const open = React.useContext(AbiertoContext)
  const [montado, setMontado] = React.useState(open)
  const [abiertoPrevio, setAbiertoPrevio] = React.useState(open)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const overlayRef = React.useRef<HTMLDivElement>(null)

  // Estado derivado del prop durante el render (no en un efecto): al abrir, se monta.
  if (open !== abiertoPrevio) {
    setAbiertoPrevio(open)
    if (open) setMontado(true)
  }

  React.useLayoutEffect(() => {
    const el = contentRef.current
    const overlay = overlayRef.current
    if (!el || !montado) return
    if (open) {
      dialogoEntra(el)
      if (overlay)
        gsap.fromTo(
          overlay,
          { opacity: 0 },
          { opacity: 1, duration: dur(0.38), clearProps: 'opacity' },
        )
      return () => {
        gsap.killTweensOf([el, overlay])
      }
    }
    if (overlay)
      gsap.to(overlay, { opacity: 0, duration: dur(0.16), ease: 'power2.in' })
    dialogoSale(el, () => setMontado(false))
    return () => {
      gsap.killTweensOf([el, overlay])
    }
  }, [open, montado])

  if (!montado) return null

  return (
    <DialogPortal forceMount>
      <DialogOverlay ref={overlayRef} forceMount />
      <DialogPrimitive.Content
        ref={contentRef}
        forceMount
        data-slot="dialog-content"
        className={cn(
          'border-linea bg-card shadow-flotante fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-[28px] border p-7',
          // Mientras sale ya no recibe clics.
          !open && 'pointer-events-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="text-texto-3 hover:bg-niebla hover:text-tinta focus-visible:shadow-foco absolute top-5 right-5 grid size-9 cursor-pointer place-items-center rounded-full transition-colors focus-visible:outline-none">
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-xl font-semibold tracking-[-0.02em]', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-texto-2 text-[15px] leading-relaxed', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
