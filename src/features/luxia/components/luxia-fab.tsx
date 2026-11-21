import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import { listarLibros } from '@/features/biblioteca/services/libros.read'
import type { ListarLibrosParams } from '@/features/biblioteca/types/api'
import { LuxiaAvatar } from '@/features/luxia/components/luxia-avatar'
import { useLuxiaController } from '@/features/luxia/hooks/use-luxia-controller'
import { usePrefersReducedMotion } from '@/features/luxia/hooks/use-prefers-reduced-motion'
import { useVisualViewportVars } from '@/features/luxia/hooks/use-visual-viewport-vars'
import { RIVE_SRC, canUseRive } from '@/features/luxia/services/avatar'
import { consultarLuxia } from '@/features/luxia/services/consulta'
import {
  MAX_MESSAGE,
  loadHistory,
  saveHistory,
} from '@/features/luxia/services/historial'
import {
  APPEAR_WAIT_MS,
  ESQUINA,
  claveDock,
  dockAnim,
  type Dock,
} from '@/features/luxia/services/vuelo'
import { useLuxiaStore } from '@/features/luxia/store'
import { LuxiaLibroCard } from '@/features/luxia/components/luxia-libro-card'
import { textos as t } from '@/features/luxia/textos'
import type { ChatMsg } from '@/features/luxia/types/chat'
import { cn } from '@/lib/utils'

import '@/features/luxia/luxia-chat.css'

/** Posición del muelle: `to` = destino actual (null = esquina) y `from` = de dónde sale el vuelo. */
type Muelle = { from: Dock; to: Dock | null }

/**
 * LuxIA: panel propio, avatar flotante que vuela al header y
 * consulta por reglas sobre /api/libros (sin LLM, sin reservas). Está siempre visible mientras
 * esté montada (aquí no hay hero que la oculte).
 */
export function LuxiaFab() {
  const queryClient = useQueryClient()
  const reduced = usePrefersReducedMotion()
  const { inputs, setMood } = useLuxiaController()
  const open = useLuxiaStore((s) => s.abierto)
  const alternar = useLuxiaStore((s) => s.alternar)
  const cerrar = useLuxiaStore((s) => s.cerrar)
  const [msgs, setMsgs] = useState<ChatMsg[]>(loadHistory)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const shown = true

  // ---- Aparición: Rive (aparecer/desaparecer) si el .riv los trae; si no, fundido CSS.
  // Sin Rive usable (tests, reduced-motion, sin canvas) el modo CSS se deriva en el render.
  const [riveUsable] = useState(() => !reduced && canUseRive())
  const [riveAppear, setRiveAppear] = useState<boolean | null>(null)
  const [waited, setWaited] = useState(false)
  const onAvatarReady = useCallback(
    (has: boolean) => {
      setRiveAppear(has)
      // Al llegar a su esquina: saludo breve (gesto=4, mano=16) y luego reposo.
      setMood('greet')
    },
    [setMood],
  )
  useEffect(() => {
    if (!riveUsable || riveAppear !== null) return undefined
    const id = window.setTimeout(() => {
      setWaited(true)
      setMood('greet')
    }, APPEAR_WAIT_MS)
    return () => window.clearTimeout(id)
  }, [riveUsable, riveAppear, setMood])
  const appearMode: 'pending' | 'rive' | 'css' = !riveUsable
    ? 'css'
    : riveAppear === true
      ? 'rive'
      : riveAppear === false || waited
        ? 'css'
        : 'pending'
  const arrived = appearMode !== 'pending'

  const [closing, setClosing] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelCleanup = useRef<(() => void) | null>(null)

  // El origen del vuelo viaja en el mismo estado que el destino (no en un ref leído en el render): cada cambio de muelle guarda de dónde sale.
  const [muelle, setMuelle] = useState<Muelle>({ from: ESQUINA, to: null })
  const dock = muelle.to
  const dockKey = claveDock(dock ?? ESQUINA)
  const dockAnimation = useMemo(
    () => dockAnim(muelle.to, muelle.from, reduced),
    [muelle, reduced],
  )

  /**
   * Destino del muelle = centro del hueco del header, medido con offsetLeft/offsetTop (layout
   * final, sin el translateY de entrada del panel ni el transform del vuelo).
   */
  const measureDock = useCallback(() => {
    const slot = slotRef.current
    const anchor = anchorRef.current
    const panel = slot?.closest<HTMLElement>('.luxia-chat') ?? null
    const flyer = anchor?.offsetParent as HTMLElement | null
    if (!slot || !panel || !anchor || !flyer || !anchor.offsetWidth) return
    let sx = slot.offsetLeft + slot.offsetWidth / 2
    let sy = slot.offsetTop + slot.offsetHeight / 2
    for (
      let el = slot.offsetParent as HTMLElement | null;
      el;
      el = el.offsetParent as HTMLElement | null
    ) {
      // offsetLeft/Top de los hijos se miden desde el borde interior: suma el borde del panel.
      sx += el.offsetLeft + el.clientLeft
      sy += el.offsetTop + el.clientTop
      if (el === panel) break
    }
    const next = {
      x: sx - (flyer.offsetLeft + anchor.offsetLeft + anchor.offsetWidth / 2),
      y: sy - (flyer.offsetTop + anchor.offsetTop + anchor.offsetHeight / 2),
      s: slot.offsetWidth / anchor.offsetWidth,
    }
    // Evita re-vuelos por diferencias subpíxel.
    setMuelle((m) =>
      m.to &&
      Math.abs(m.to.x - next.x) < 0.5 &&
      Math.abs(m.to.y - next.y) < 0.5 &&
      Math.abs(m.to.s - next.s) < 0.002
        ? m
        : { from: m.to ?? ESQUINA, to: next },
    )
  }, [])

  // Se mide cuando el panel entra en el DOM, no con setState en un useLayoutEffect
  // (ref callback: el layout ya está calculado) y luego con ResizeObserver y resize de ventana.
  const panelRef = useCallback(
    (node: HTMLElement | null) => {
      panelCleanup.current?.()
      panelCleanup.current = null
      if (!node) return
      measureDock()
      window.addEventListener('resize', measureDock)
      const ro =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => measureDock())
          : null
      ro?.observe(node)
      panelCleanup.current = () => {
        window.removeEventListener('resize', measureDock)
        ro?.disconnect()
      }
    },
    [measureDock],
  )

  const kbOpen = useVisualViewportVars(open, rootRef, measureDock)

  // Abrir y cerrar llegan por el store (botón flotante, sidebar, barra superior o Escape). La
  // reacción va en el listener del store, no en un efecto que mire `open`.
  useEffect(
    () =>
      useLuxiaStore.subscribe((s, prev) => {
        if (s.abierto && !prev.abierto) setMood('greet')
        if (!s.abierto && prev.abierto) {
          setClosing(true)
          // El foco vuelve al botón que lo abrió (o al de LuxIA) sin esperar a que el panel salga.
          const destino = s.opener?.isConnected ? s.opener : btnRef.current
          window.setTimeout(() => destino?.focus(), 0)
        }
      }),
    [setMood],
  )

  useEffect(() => saveHistory(msgs), [msgs])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, busy, open])

  /** Panel ya desvanecido → ahora sí LuxIA vuelve a su esquina y queda en reposo. */
  const onPanelExited = useCallback(() => {
    setClosing(false)
    setMuelle((m) => ({ from: m.to ?? ESQUINA, to: null }))
    setMood('idle')
  }, [setMood])

  const buscar = useCallback(
    (params: ListarLibrosParams) =>
      queryClient.fetchQuery({
        queryKey: queryKeys.libros.list(params),
        queryFn: () => listarLibros(params),
      }),
    [queryClient],
  )

  /** `base` = conversación previa (en reintento, sin el último mensaje fallido para no duplicarlo). */
  const send = async (preset?: string, base: ChatMsg[] = msgs) => {
    const text = (preset ?? draft).trim().slice(0, MAX_MESSAGE)
    if (!text || busy) return
    setMsgs([...base, { role: 'user', text }])
    setDraft('')
    setError(false)
    setBusy(true)
    setMood('thinking')
    try {
      const reply = await consultarLuxia(text, buscar)
      setMsgs((m) => [...m, reply])
      setMood('talking')
    } catch {
      setError(true)
      setMood('error')
    } finally {
      setBusy(false)
    }
  }

  const lastMsg = msgs[msgs.length - 1]
  const canRetry = error && lastMsg?.role === 'user'
  const retry = () => {
    if (canRetry && lastMsg) void send(lastMsg.text, msgs.slice(0, -1))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        'luxia-fab',
        open && 'is-open',
        reduced && 'is-reduced',
        kbOpen && 'is-kb',
      )}
      data-testid="luxia-fab"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation()
          cerrar()
        }
      }}
    >
      <AnimatePresence onExitComplete={onPanelExited}>
        {open && (
          <motion.section
            key="luxia-chat"
            ref={panelRef}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.28, ease: 'easeOut' },
            }}
            exit={{
              opacity: 0,
              y: reduced ? 0 : 8,
              transition: { duration: 0.25, ease: 'easeIn' },
            }}
            className="luxia-chat"
            role="dialog"
            aria-modal="false"
            aria-labelledby="luxia-chat-title"
          >
            <header className="luxia-chat__head">
              {/* Hueco donde aterriza (flotando) la LuxIA del botón; no es una copia. */}
              <div
                className="luxia-chat__slot"
                ref={slotRef}
                aria-hidden="true"
                data-testid="luxia-chat-slot"
              />
              <div className="luxia-chat__title">
                <h2 id="luxia-chat-title">LuxIA</h2>
                <p data-testid="luxia-status">
                  <span
                    className={cn('luxia-chat__dot', error && 'is-off')}
                    aria-hidden="true"
                  />{' '}
                  {busy ? t.typing : error ? t.offline : t.subtitle}
                </p>
              </div>
              <button
                type="button"
                className="luxia-chat__close"
                onClick={cerrar}
                aria-label={t.close}
              >
                ×
              </button>
            </header>
            <div
              className="luxia-chat__msgs"
              ref={listRef}
              role="log"
              aria-live="polite"
              aria-label={t.log}
            >
              <div
                className="luxia-chat__msg is-assistant"
                data-testid="luxia-chat-msg"
              >
                {t.greeting}
              </div>
              {msgs.map((m, i) => (
                <Fragment key={i}>
                  {m.text && (
                    <div
                      className={`luxia-chat__msg is-${m.role}`}
                      data-testid="luxia-chat-msg"
                    >
                      {m.text}
                    </div>
                  )}
                  {m.role === 'assistant' &&
                  (m.libros?.length || m.consulta) ? (
                    <div className="luxia-chat__links">
                      {m.libros?.map((libro) => (
                        <LuxiaLibroCard
                          key={libro.idLibro}
                          libro={libro}
                          onNavegar={cerrar}
                        />
                      ))}
                      {m.consulta && m.total ? (
                        <Link
                          to="/catalogo"
                          search={{ page: 1, pageSize: 12, buscar: m.consulta }}
                          className="luxia-chat__ver-todos"
                          onClick={cerrar}
                        >
                          Ver todos en el catálogo
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </Fragment>
              ))}
              {busy && (
                <div
                  className="luxia-chat__msg is-assistant luxia-chat__typing"
                  aria-label={t.typing}
                >
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {error && (
                <div className="luxia-chat__error" role="alert">
                  {t.errorGeneric}
                  {canRetry && (
                    <button
                      type="button"
                      className="luxia-chat__retry"
                      onClick={retry}
                    >
                      {t.retry}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="luxia-chat__chips" data-testid="luxia-chips">
              {t.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="luxia-chat__chip"
                  disabled={busy}
                  onClick={() => void send(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
            <form
              className="luxia-chat__form"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.placeholder}
                aria-label={t.inputAria}
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label={t.send}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  aria-hidden="true"
                >
                  <path
                    d="M4 12h14M12 5l7 7-7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Siempre montada (un solo canvas): Rive recibe aparecer/desaparecer sin perder estado. */}
      <div
        className={`luxia-fab__flyer is-appear-${appearMode} ${shown ? 'is-shown' : 'is-hidden'}`}
        data-testid="luxia-flyer"
        data-appear={appearMode}
        data-shown={shown ? '1' : '0'}
      >
        <div
          className="luxia-fab__anchor"
          ref={anchorRef}
          data-testid="luxia-anchor"
          data-dock={dock ? 'header' : 'corner'}
          data-dock-target={dockKey}
          data-closing={closing || undefined}
        >
          <motion.div
            className="luxia-fab__dock"
            initial={false}
            animate={dockAnimation}
          >
            <div
              className={cn(
                'luxia-fab__bob',
                dock
                  ? 'is-docked-float'
                  : arrived && shown && !reduced && 'is-floating',
              )}
              data-testid="luxia-bob"
            >
              <button
                ref={btnRef}
                type="button"
                className="luxia-fab__btn"
                onClick={(e) => alternar(e.currentTarget)}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={open ? t.close : t.open}
              >
                <span
                  className="luxia-fab__shadow"
                  data-testid="luxia-shadow"
                  aria-hidden="true"
                />
                <LuxiaAvatar
                  riveSrc={reduced ? undefined : RIVE_SRC}
                  inputs={inputs}
                  variante={0}
                  shown={shown}
                  onReady={onAvatarReady}
                />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
