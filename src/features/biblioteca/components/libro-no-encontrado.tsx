import heroBlobs from '@/assets/hero-blobs.png'

export function LibroNoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-4 py-10 text-center">
      <img src={heroBlobs} alt="" className="h-36 w-52 rounded-2xl border-2 border-tinta object-cover shadow-cartoon" />
      <h1 className="font-display text-4xl text-verde">Libro no encontrado</h1>
      <p className="text-sm">Ese título no está en la biblioteca.</p>
    </main>
  )
}
