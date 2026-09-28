import { useEffect, useState } from 'react'
import { splitRemaining } from '../utils/schedule'

/** Always derives remaining time from the scheduled timestamp to avoid drift. */
export function useCountdown(scheduledAt: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!scheduledAt) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    const onVisibility = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [scheduledAt])

  if (!scheduledAt) {
    return { remainingMs: 0, parts: splitRemaining(0), isReady: false }
  }

  const remainingMs = new Date(scheduledAt).getTime() - now
  return {
    remainingMs,
    parts: splitRemaining(remainingMs),
    isReady: remainingMs <= 0,
  }
}
