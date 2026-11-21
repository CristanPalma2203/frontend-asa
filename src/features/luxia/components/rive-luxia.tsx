import {
  Alignment,
  Fit,
  Layout,
  Rive,
  RuntimeLoader,
  useRive,
} from '@rive-app/react-canvas'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import type { LuxiaInputs } from '@/features/luxia/hooks/use-luxia-controller'
import {
  ARTBOARD,
  SM,
  bootLuxiaRive,
  hasAppearControl,
  syncShown,
  type LuxiaRiveInputs,
  type RiveLike,
} from '@/features/luxia/services/rive-control'

Rive.suppressDeprecationWarnings = ['state-machine-inputs']

RuntimeLoader.setWasmUrl(`${import.meta.env.BASE_URL}luxia/rive.wasm`)
RuntimeLoader.setWasmFallbackUrl(
  `${import.meta.env.BASE_URL}luxia/rive_fallback.wasm`,
)

export default function RiveLuxia({
  src,
  inputs,
  variante,
  shown,
  onReady,
  resizeToken = 0,
  onError,
}: {
  src: string
  inputs: LuxiaInputs
  variante: number
  shown: boolean
  onReady: (hasAppear: boolean) => void
  resizeToken?: number
  onError: () => void
}) {
  const ctl = useRef<LuxiaRiveInputs | null>(null)
  const last = useRef({ shown: false })
  const [booted, setBooted] = useState(false)
  const varRef = useRef(variante)

  useLayoutEffect(() => {
    varRef.current = variante
  }, [variante])

  const onRiveReady = useCallback(
    (r: unknown) => {
      ctl.current = bootLuxiaRive(r as RiveLike, varRef.current)
      setBooted(true)
      onReady(hasAppearControl(ctl.current))
    },
    [onReady],
  )

  const { rive, RiveComponent } = useRive({
    src,
    artboard: ARTBOARD,
    stateMachine: SM,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: onError,
    onRiveReady,
  } as Parameters<typeof useRive>[0])

  useEffect(() => {
    if (ctl.current?.variante) ctl.current.variante.value = variante
  }, [variante, booted])

  useEffect(() => {
    if (booted && ctl.current) syncShown(ctl.current, shown, last.current)
  }, [booted, shown])

  useEffect(() => {
    const c = ctl.current
    if (!booted || !c) return
    if (c.estado) c.estado.value = inputs.estado
    if (c.gesto) c.gesto.value = inputs.gesto
    if (c.mano) c.mano.value = inputs.mano
  }, [booted, inputs])

  useEffect(() => {
    if (rive && resizeToken) rive.resizeDrawingSurfaceToCanvas()
  }, [rive, resizeToken])

  return <RiveComponent aria-hidden="true" className="luxia-fab__rive" />
}
