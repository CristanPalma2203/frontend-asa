import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Hueso } from '@/components/ui/hueso'
import { HUESO_OSCURO } from '@/components/ui/hueso.bones'

const recibidas: Record<string, unknown>[] = []

vi.mock('boneyard-js/react', () => ({
  Skeleton: (props: { children?: ReactNode } & Record<string, unknown>) => {
    recibidas.push(props)
    return <div>{props.children}</div>
  },
}))

describe('Hueso', () => {
  it('pasa color a Skeleton y el brillo por boneClass + variables CSS', () => {
    recibidas.length = 0
    const { container } = render(
      <Hueso cargando alto={36} ancho={88} radio={999} {...HUESO_OSCURO} />,
    )
    expect(recibidas.at(-1)).toMatchObject({
      color: 'rgba(194,249,104,0.14)',
      boneClass: 'hueso-brillo',
    })
    const envoltorio = container.firstElementChild as HTMLElement
    expect(envoltorio.style.getPropertyValue('--hueso-color')).toBe(
      'rgba(194,249,104,0.14)',
    )
    expect(envoltorio.style.getPropertyValue('--hueso-brillo')).toBe(
      'rgba(194,249,104,0.28)',
    )
  })

  it('sin colores deja los de la config global', () => {
    recibidas.length = 0
    render(<Hueso cargando alto={20} />)
    expect(recibidas.at(-1)?.color).toBeUndefined()
    expect(recibidas.at(-1)?.boneClass).toBeUndefined()
  })
})
