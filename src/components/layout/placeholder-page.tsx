import { Card } from '@/components/ui/card'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
      </Card>
    </main>
  )
}
