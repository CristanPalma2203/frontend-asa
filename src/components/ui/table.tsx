import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * `accionesFijas`: la última columna (acciones) queda fija a la derecha cuando la tabla hace
 * scroll horizontal (móvil), así los botones siempre se ven.
 */
function Table({
  className,
  accionesFijas = false,
  ...props
}: React.ComponentProps<'table'> & { accionesFijas?: boolean }) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        'bg-card border-linea shadow-card relative w-full overflow-x-auto rounded-xl border',
        accionesFijas &&
          '[&_td:last-child]:bg-card [&_th:last-child]:bg-hueso-claro [&_td:last-child]:sticky [&_td:last-child]:right-0 [&_td:last-child]:z-[1] [&_th:last-child]:sticky [&_th:last-child]:right-0 [&_th:last-child]:z-[1]',
      )}
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-left text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        'bg-hueso-claro [&_tr]:border-linea [&_tr]:border-b [&_tr]:hover:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-linea bg-niebla border-t font-medium', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-linea hover:bg-lima-wash/60 border-b transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-texto-3 h-11 px-4 text-left align-middle text-[11px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('text-texto px-4 py-3 align-middle', className)}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
