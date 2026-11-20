import { Skeleton } from '@/components/ui/skeleton'

export function CatalogoSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-40 rounded-2xl border-2 border-tinta" />
        </li>
      ))}
    </ul>
  )
}

export function FichaSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 md:grid-cols-[16rem_1fr]">
      <Skeleton className="h-80 rounded-2xl border-2 border-tinta" />
      <Skeleton className="h-80 rounded-2xl border-2 border-tinta" />
    </main>
  )
}

export function ReservasSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-28 rounded-2xl border-2 border-tinta" />
      <Skeleton className="h-28 rounded-2xl border-2 border-tinta" />
    </div>
  )
}
