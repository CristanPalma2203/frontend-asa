import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors outline-none focus-visible:shadow-foco disabled:pointer-events-none disabled:cursor-not-allowed disabled:border disabled:border-linea disabled:bg-niebla disabled:text-texto-5 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-pino-850 active:bg-pino-900',
        accent: 'bg-accent text-accent-foreground hover:bg-lima-500',
        outline:
          'border border-linea-fuerte bg-papel text-tinta hover:border-tinta disabled:border-transparent',
        ghost: 'bg-transparent text-pino-800 hover:bg-niebla',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-rojo-700',
        link: 'h-auto px-0 text-pino-800 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-[22px] text-[15px]',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-14 px-7 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
