import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from './app.js'

export function useServerTime() {
  const [serverNow, setServerNow] = useState(null)

  useEffect(() => {
    let offset = null
    const updateTime = () => {
      if (offset !== null) setServerNow(Date.now() + offset)
    }
    const unsubscribe = onValue(ref(db, '.info/serverTimeOffset'), (snapshot) => {
      offset = snapshot.val() ?? 0
      updateTime()
    })
    const timer = setInterval(updateTime, 200)

    return () => {
      unsubscribe()
      clearInterval(timer)
    }
  }, [])

  return serverNow
}