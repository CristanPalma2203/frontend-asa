import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

// Panel lateral sobre Radix Dialog: a la derecha desde `sm`, hoja inferior en móvil.

const Sheet = DialogPrimitive.Root
const SheetTitle = DialogPrimitive.Title
const SheetDescription = DialogPrimitive.Description
const SheetClose = DialogPrimitive.Close

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-pino-950/35 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 fixed inset-0 z-50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'bg-card shadow-flotante data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col overflow-y-auto outline-none',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 max-h-[88svh] rounded-t-[28px]',
          'sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-[min(440px,100vw)] sm:rounded-none sm:rounded-l-[28px]',
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
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle }
