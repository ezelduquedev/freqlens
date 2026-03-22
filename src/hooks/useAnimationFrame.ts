import { useEffect, useRef } from 'react'

type Callback = () => void

export function useAnimationFrame(callback: Callback, active: boolean): void {
  const rafRef      = useRef<number>(0)
  const callbackRef = useRef<Callback>(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const loop = () => {
      callbackRef.current()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(rafRef.current)
  }, [active])
}