import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {
  isSoftwareWebGL,
  loseWebGlCanvases,
} from '@/features/biblioteca/components/hero-backdrop.webgl'

const MeshGradientLazy = lazy(() =>
  import('@paper-design/shaders-react').then((mod) => ({
    default: mod.MeshGradient,
  })),
)

const SHADER_COLORS = ['#032A21', '#021912', '#C2F968', '#0A3D32', '#1E1E1E']
const RETRASO_SHADER_MS = 800

const consultaReducida = '(prefers-reduced-motion: reduce)'

function suscribirMovimiento(avisar: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(consultaReducida)
  mq.addEventListener('change', avisar)
  return () => mq.removeEventListener('change', avisar)
}

function movimientoReducido() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(consultaReducida).matches
  )
}

function suscribirVisibilidad(avisar: () => void) {
  document.addEventListener('visibilitychange', avisar)
  return () => document.removeEventListener('visibilitychange', avisar)
}

function pestanaVisible() {
  return document.visibilityState === 'visible'
}

class ShaderGate extends Component<{ children?: ReactNode }, { ok: boolean }> {
  state = { ok: true }

  static getDerivedStateFromError() {
    return { ok: false }
  }

  render() {
    return this.state.ok ? this.props.children : null
  }
}

function MeshGradientHost({ live }: { live: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = hostRef.current
    return () => loseWebGlCanvases(node)
  }, [])

  return (
    <div ref={hostRef} className="absolute inset-0">
      <ShaderGate>
        <Suspense fallback={null}>
          <MeshGradientLazy
            className="hero-fx__shader"
            colors={SHADER_COLORS}
            distortion={0.68}
            swirl={0.16}
            grainMixer={0.22}
            grainOverlay={0.1}
            speed={live ? 0.2 : 0}
            scale={1.05}
            minPixelRatio={1}
            maxPixelCount={700_000}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </ShaderGate>
    </div>
  )
}

export function HeroBackdrop({
  variante = 'oscuro',
}: {
  variante?: 'oscuro' | 'celeste'
} = {}) {
  const reduce = useSyncExternalStore(
    suscribirMovimiento,
    movimientoReducido,
    () => true,
  )
  const visible = useSyncExternalStore(
    suscribirVisibilidad,
    pestanaVisible,
    () => false,
  )
  const [software] = useState(isSoftwareWebGL)
  const [enPantalla, setEnPantalla] = useState(true)
  const [shaderListo, setShaderListo] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const staticHero = reduce || software
  const live = !staticHero && visible && enPantalla
  const shaderOn = shaderListo && !staticHero && variante === 'oscuro'

  useEffect(() => {
    if (staticHero) return undefined
    const id = window.setTimeout(() => setShaderListo(true), RETRASO_SHADER_MS)
    return () => window.clearTimeout(id)
  }, [staticHero])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return undefined
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(() => {
        setEnPantalla(node.getBoundingClientRect().bottom > 0)
      })
      io.observe(node)
    }
    return () => {
      io?.disconnect()
      loseWebGlCanvases(node)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={
        variante === 'oscuro' ? 'hero-fx' : `hero-fx hero-fx--${variante}`
      }
    >
      <div className="hero-fx__wash" />
      {shaderOn ? <MeshGradientHost live={live} /> : null}
      <HeroGrid
        paused={!live}
        staticCells={staticHero}
        rgbCeldas={variante === 'celeste' ? '124, 196, 232' : '194, 249, 104'}
      />
      <div className="hero-fx__vignette" />
    </div>
  )
}

const CELL = 64
const MAX_CELLS = 14
const SEMILLAS_ESTATICAS = [
  [4, 3, 0.16],
  [9, 2, 0.12],
  [7, 5, 0.18],
  [12, 4, 0.1],
  [5, 7, 0.14],
] as const

type Celda = {
  col: number
  row: number
  born: number
  life: number
  peak: number
  used: boolean
}

function HeroGrid({
  paused,
  staticCells,
  rgbCeldas,
}: {
  paused: boolean
  staticCells: boolean
  rgbCeldas: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const kickRef = useRef<() => void>(() => {})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return undefined

    const pool: Celda[] = Array.from({ length: MAX_CELLS }, () => ({
      col: 0,
      row: 0,
      born: 0,
      life: 0,
      peak: 0,
      used: false,
    }))

    let cols = 1
    let rows = 1
    let raf = 0
    let lastSpawn = 0

    const paintCell = (col: number, row: number, alpha: number) => {
      ctx.fillStyle = `rgba(${rgbCeldas}, ${alpha})`
      ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1)
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const [c, r, a] of SEMILLAS_ESTATICAS) paintCell(c, r, a)
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.max(1, Math.floor(w))
      canvas.height = Math.max(1, Math.floor(h))
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      cols = Math.max(1, Math.ceil(w / CELL))
      rows = Math.max(1, Math.ceil(h / CELL))
      if (staticCells) drawStatic()
    }

    const spawn = (now: number) => {
      const slot = pool.find((cell) => !cell.used)
      if (!slot) return
      slot.used = true
      slot.col = (Math.random() * cols) | 0
      slot.row = (Math.random() * rows) | 0
      slot.born = now
      slot.life = 2200 + Math.random() * 1800
      slot.peak = 0.14 + Math.random() * 0.12
    }

    const tick = (now: number) => {
      if (pausedRef.current) {
        raf = 0
        return
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (now - lastSpawn > 520) {
        spawn(now)
        lastSpawn = now
      }
      for (const cell of pool) {
        if (!cell.used) continue
        const t = (now - cell.born) / cell.life
        if (t >= 1) {
          cell.used = false
          continue
        }
        const envelope =
          t < 0.18 ? t / 0.18 : t > 0.72 ? 1 - (t - 0.72) / 0.28 : 1
        paintCell(cell.col, cell.row, cell.peak * envelope)
      }
      raf = window.requestAnimationFrame(tick)
    }

    const kick = () => {
      if (raf || pausedRef.current) return
      raf = window.requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    if (!staticCells) {
      kickRef.current = kick
      kick()
    }

    return () => {
      kickRef.current = () => {}
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [staticCells, rgbCeldas])

  useEffect(() => {
    pausedRef.current = paused
    if (!paused && !staticCells) kickRef.current()
  }, [paused, staticCells])

  return (
    <div className="hero-fx__grid">
      <canvas ref={canvasRef} />
    </div>
  )
}
