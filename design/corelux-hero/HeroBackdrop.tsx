import { useReducedMotion } from "motion/react";
import React, {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const MeshGradientLazy = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.MeshGradient }))
);

const SHADER_COLORS = ["#032A21", "#021912", "#C2F968", "#0A3D32", "#1E1E1E"];

/**
 * SwiftShader / llvmpipe / etc.: el rAF del MeshGradient (y uno huérfano si el dispose
 * llega tarde al navegar Login → Recuperar) satura el hilo y Playwright nunca ve el
 * botón «Enviar código» estable. En software no montamos WebGL: basta el wash + grid estático.
 */
let softwareWebGlCache: boolean | null = null;

export function isSoftwareWebGL(): boolean {
  if (softwareWebGlCache != null) return softwareWebGlCache;
  if (typeof document === "undefined") {
    softwareWebGlCache = true;
    return true;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl2") as WebGLRenderingContext | null) ||
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      softwareWebGlCache = true;
      return true;
    }
    const info = gl.getExtension("WEBGL_debug_renderer_info") as {
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "") : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    softwareWebGlCache = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(
      renderer
    );
    return softwareWebGlCache;
  } catch {
    softwareWebGlCache = true;
    return true;
  }
}

/** Solo tests: reinicia la caché de detección de WebGL software. */
export function resetSoftwareWebGlCache(): void {
  softwareWebGlCache = null;
}

function loseWebGlCanvases(root: ParentNode | null | undefined) {
  if (!root) return;
  root.querySelectorAll("canvas").forEach((canvas) => {
    try {
      const gl =
        (canvas.getContext("webgl2") as WebGLRenderingContext | null) ||
        (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
        (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // no-op
    }
  });
}

class ShaderGate extends Component<{ children?: ReactNode }, { ok: boolean }> {
  constructor(props: { children?: ReactNode }) {
    super(props);
    this.state = { ok: true };
  }

  componentDidCatch() {
    this.setState({ ok: false });
  }

  static getDerivedStateFromError() {
    return { ok: false };
  }

  render() {
    if (!this.state.ok) return null;
    return this.props.children;
  }
}

/** Monta MeshGradient y al desmontar fuerza loseContext (Paper dispose no lo llama). */
function MeshGradientHost({ live }: { live: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = hostRef.current;
    return () => {
      loseWebGlCanvases(node);
    };
  }, []);

  return (
    <div ref={hostRef} className="hero__shader-host" style={{ position: "absolute", inset: 0 }}>
      <ShaderGate>
        <Suspense fallback={null}>
          <MeshGradientLazy
            className="hero__shader"
            colors={SHADER_COLORS}
            distortion={0.68}
            swirl={0.16}
            grainMixer={0.22}
            grainOverlay={0.1}
            speed={live ? 0.2 : 0}
            scale={1.05}
            minPixelRatio={1}
            maxPixelCount={700_000}
            style={{ width: "100%", height: "100%" }}
          />
        </Suspense>
      </ShaderGate>
    </div>
  );
}

export function HeroBackdrop() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [shaderOn, setShaderOn] = useState(false);
  const [software, setSoftware] = useState(() =>
    typeof document === "undefined" ? true : isSoftwareWebGL()
  );

  useEffect(() => {
    setSoftware(isSoftwareWebGL());
  }, []);

  const staticHero = Boolean(reduce) || software;

  useEffect(() => {
    if (staticHero) {
      setShaderOn(false);
      return undefined;
    }
    const id = window.setTimeout(() => setShaderOn(true), 800);
    return () => window.clearTimeout(id);
  }, [staticHero]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const sync = () => {
      const visible = document.visibilityState === "visible";
      const onScreen = node.getBoundingClientRect().bottom > 0;
      setLive(!staticHero && visible && onScreen);
    };

    sync();
    const io = new IntersectionObserver(sync, { threshold: 0 });
    io.observe(node);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      // Cinturón: si el dispose de Paper quedó a medias al cambiar de ruta auth.
      loseWebGlCanvases(node);
    };
  }, [staticHero]);

  return (
    <div className="hero__fx" ref={rootRef} aria-hidden="true">
      <div className="hero__wash" />
      {shaderOn ? <MeshGradientHost live={live} /> : null}
      <HeroGrid paused={!live || staticHero} staticCells={staticHero} />
      <div className="hero__vignette" />
    </div>
  );
}

const CELL = 64;
const MAX_CELLS = 14;

function HeroGrid({ paused, staticCells }: { paused: boolean; staticCells: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const kickRef = useRef<() => void>(() => {});
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    const pool: Array<{
      col: number;
      row: number;
      born: number;
      life: number;
      peak: number;
      used: boolean;
    }> = Array.from({ length: MAX_CELLS }, () => ({
      col: 0,
      row: 0,
      born: 0,
      life: 0,
      peak: 0,
      used: false,
    }));

    let cols = 1;
    let rows = 1;
    let raf = 0;
    let lastSpawn = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      cols = Math.max(1, Math.ceil(w / CELL));
      rows = Math.max(1, Math.ceil(h / CELL));
    };

    const spawn = (now: number) => {
      const slot = pool.find((cell) => !cell.used);
      if (!slot) return;
      slot.used = true;
      slot.col = (Math.random() * cols) | 0;
      slot.row = (Math.random() * rows) | 0;
      slot.born = now;
      slot.life = 2200 + Math.random() * 1800;
      slot.peak = 0.14 + Math.random() * 0.12;
    };

    const paintCell = (cell: { col: number; row: number }, alpha: number) => {
      ctx.fillStyle = `rgba(194, 249, 104, ${alpha})`;
      ctx.fillRect(cell.col * CELL + 1, cell.row * CELL + 1, CELL - 1, CELL - 1);
    };

    const drawStatic = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const seeds = [
        [4, 3, 0.16],
        [9, 2, 0.12],
        [7, 5, 0.18],
        [12, 4, 0.1],
        [5, 7, 0.14],
      ];
      seeds.forEach(([c, r, a]) => paintCell({ col: c, row: r }, a as number));
    };

    const tick = (now: number) => {
      if (pausedRef.current) {
        raf = 0;
        return;
      }
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (now - lastSpawn > 520) {
        spawn(now);
        lastSpawn = now;
      }
      let alive = false;
      for (let i = 0; i < pool.length; i += 1) {
        const cell = pool[i];
        if (!cell.used) continue;
        const t = (now - cell.born) / cell.life;
        if (t >= 1) {
          cell.used = false;
          continue;
        }
        alive = true;
        const envelope = t < 0.18 ? t / 0.18 : t > 0.72 ? 1 - (t - 0.72) / 0.28 : 1;
        paintCell(cell, cell.peak * envelope);
      }

      raf = alive || !pausedRef.current ? window.requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (raf || pausedRef.current) return;
      raf = window.requestAnimationFrame(tick);
    };
    kickRef.current = kick;

    resize();
    window.addEventListener("resize", resize);

    if (staticCells) {
      drawStatic();
      return () => {
        kickRef.current = () => {};
        window.cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    }

    kick();
    return () => {
      kickRef.current = () => {};
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [staticCells]);

  useEffect(() => {
    if (paused || staticCells) return undefined;
    kickRef.current();
    return undefined;
  }, [paused, staticCells]);

  return (
    <div className="hero__grid">
      <canvas ref={canvasRef} />
    </div>
  );
}
