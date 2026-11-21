import { lazy, Suspense, useState } from 'react'

import type { LuxiaInputs } from '@/features/luxia/hooks/use-luxia-controller'
import { PLACEHOLDER_SRC, canUseRive } from '@/features/luxia/services/avatar'

const RiveLuxia = lazy(() => import('@/features/luxia/components/rive-luxia'))

export function LuxiaAvatar({
  riveSrc,
  inputs,
  variante = 0,
  shown = true,
  onReady,
}: {
  riveSrc?: string
  inputs: LuxiaInputs
  variante?: number
  shown?: boolean
  onReady?: (hasAppear: boolean) => void
}) {
  const [failed, setFailed] = useState(false)
  const useRiveArt = !!riveSrc && !failed && canUseRive()
  const fallback = (
    <img
      className="luxia-fab__img"
      src={PLACEHOLDER_SRC}
      alt=""
      aria-hidden="true"
    />
  )
  if (!useRiveArt || !riveSrc) return fallback
  return (
    <Suspense fallback={fallback}>
      <RiveLuxia
        src={riveSrc}
        inputs={inputs}
        variante={variante}
        shown={shown}
        onReady={onReady ?? (() => undefined)}
        onError={() => {
          setFailed(true)
          onReady?.(false)
        }}
      />
    </Suspense>
  )
}
