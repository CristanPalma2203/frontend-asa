import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="text-texto-3 hover:bg-niebla hover:text-tinta focus-visible:shadow-foco absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-colors outline-none"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-[18px]" strokeWidth={2} />
        ) : (
          <Eye aria-hidden className="size-[18px]" strokeWidth={2} />
        )}
      </button>
    </div>
  )
}
