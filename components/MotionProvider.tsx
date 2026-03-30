'use client'

import { LazyMotion, domMax } from 'framer-motion'

// LazyMotion defers loading the full animation feature set until needed.
// domMax (vs domAnimation) is required because components use `layout` and `layoutId`
// props for shared/layout animations. domAnimation excludes layout support.
// All child components must use `m.div` etc. (from 'framer-motion') not `motion.div`.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  )
}
