import { configureBoneyard } from 'boneyard-js/react'

// Configuración global de boneyard. `select: 'container'` (no 'viewport') porque cada Skeleton es
// un hueco pequeño dentro de su componente.
// Huesos a mano (huesoUnico en components/ui/hueso.tsx): sin CLI ni capturas.
configureBoneyard({
  color: '#e6e2da',
  darkColor: '#2a2a2a',
  animate: 'shimmer',
  shimmerColor: '#fafaf8',
  darkShimmerColor: '#333333',
  speed: '1.4s',
  shimmerAngle: 110,
  stagger: true,
  transition: 200,
  select: 'container',
})
