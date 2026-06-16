import { useCallback, useEffect, useState } from 'react'

export function useCalendar() {
  const [connected, setConnected] = useState(false)
  const [hasCredentials, setHasCredentials] = useState(false)
  const [credentialsPath, setCredentialsPath] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const api = window.studySlots?.google
    if (!api) return
    try {
      const s = await api.status()
      setConnected(s.connected)
      setHasCredentials(s.hasCredentials)
      setCredentialsPath(s.credentialsPath)
    } catch {
      /* main process unavailable */
    }
  }, [])

  useEffect(() => {
    refresh()
    // re-check when the window regains focus, e.g. after the user drops the
    // credentials file into the folder or finishes the browser consent flow
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const openFolder = useCallback(() => {
    window.studySlots?.google.openFolder()
  }, [])

  const connect = useCallback(async () => {
    const api = window.studySlots?.google
    if (!api) {
      setError('Calendar is only available in the desktop app')
      return
    }
    setConnecting(true)
    setError(null)
    try {
      const res = await api.connect()
      setConnected(res.connected)
      if (res.error) setError(res.error)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setConnecting(false)
      refresh()
    }
  }, [refresh])

  const createEvent = useCallback(
    async (opts: { summary: string; description: string; startISO: string; endISO: string }) => {
      const api = window.studySlots?.google
      if (!api) return { ok: false, error: 'Calendar is only available in the desktop app' }
      try {
        return await api.createEvent(opts)
      } catch (e: any) {
        return { ok: false, error: e?.message ?? String(e) }
      }
    },
    []
  )

  return { connected, hasCredentials, credentialsPath, connecting, error, connect, createEvent, openFolder }
}
