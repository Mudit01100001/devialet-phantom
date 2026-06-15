'use client'

import dynamic from 'next/dynamic'

// The 3D scene must never render on the server.
const Experience = dynamic(() => import('@/components/Experience'), { ssr: false })

export default function Home() {
  return <Experience />
}
