let softwareWebGlCache: boolean | null = null

export function isSoftwareWebGL(): boolean {
  if (softwareWebGlCache != null) return softwareWebGlCache
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2') as WebGLRenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (!gl) {
      softwareWebGlCache = true
      return true
    }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '')
      : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    softwareWebGlCache =
      /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(
        renderer,
      )
    return softwareWebGlCache
  } catch {
    softwareWebGlCache = true
    return true
  }
}

export function resetSoftwareWebGlCache(): void {
  softwareWebGlCache = null
}

export function loseWebGlCanvases(root: ParentNode | null | undefined) {
  if (!root) return
  root.querySelectorAll('canvas').forEach((canvas) => {
    try {
      const gl =
        (canvas.getContext('webgl2') as WebGLRenderingContext | null) ||
        (canvas.getContext('webgl') as WebGLRenderingContext | null)
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      return
    }
  })
}
