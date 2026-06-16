import { useCallback, useEffect, useRef, useState } from 'react'

// Wraps the main-process timer (which keeps ticking while minimized).
// Falls back to a local interval when running outside Electron (e.g. vite in a browser).
export function useTimer(onDone?: () => void) {
  const [remaining, setRemaining] = useState(0)
  const [paused, setPaused] = useState(false)

  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const localInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const bridge = window.studySlots?.timer

  useEffect(() => {
    if (!bridge) return
    const offTick = bridge.onTick((r) => setRemaining(r))
    const offDone = bridge.onDone(() => onDoneRef.current?.())
    return () => {
      offTick()
      offDone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearLocal = () => {
    if (localInterval.current) {
      clearInterval(localInterval.current)
      localInterval.current = null
    }
  }

  const start = useCallback(
    (seconds: number) => {
      setRemaining(seconds)
      setPaused(false)
      pausedRef.current = false
      if (bridge) {
        bridge.start(seconds)
        return
      }
      clearLocal()
      localInterval.current = setInterval(() => {
        if (pausedRef.current) return
        setRemaining((r) => {
          if (r <= 1) {
            clearLocal()
            onDoneRef.current?.()
            return 0
          }
          return r - 1
        })
      }, 1000)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const pause = useCallback(() => {
    setPaused(true)
    pausedRef.current = true
    bridge?.pause()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resume = useCallback(() => {
    setPaused(false)
    pausedRef.current = false
    bridge?.resume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stop = useCallback(() => {
    setPaused(false)
    pausedRef.current = false
    setRemaining(0)
    bridge?.stop()
    clearLocal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => clearLocal, [])

  return { remaining, paused, start, pause, resume, stop }
}
