import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-niebla text-niebla-fg',
        destructive: 'bg-cancelada text-rojo-800',
        outline: 'border border-linea-fuerte bg-papel text-texto-3',
        /** Stock disponible: lima, solo para señalar disponibilidad. */
        disponible: 'bg-lima-400 text-pino-800',
        activa: 'bg-lima-100 text-activa-fg',
        reservado: 'bg-ambar-100 text-ambar-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
