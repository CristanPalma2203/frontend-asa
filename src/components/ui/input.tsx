import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-linea-fuerte bg-papel text-tinta placeholder:text-texto-4 focus-visible:border-pino-800 focus-visible:shadow-foco disabled:bg-niebla aria-invalid:border-rojo-600 aria-invalid:bg-rojo-50 flex h-12 w-full rounded-[12px] border px-4 text-[15px] transition-[border-color,box-shadow] outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
