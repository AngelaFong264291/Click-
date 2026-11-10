import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import { auth } from './app.js'
import { AuthContext } from './authContext.js'

// App 一開就匿名登入。Firebase 預設將 session 存喺 IndexedDB，
// 所以 refresh 之後會攞返同一個 uid，唔會再開新身份。
export function AuthProvider({ children }) {
  const [uid, setUid] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
        setError(null)
      } else {
        setUid(null)
        signInAnonymously(auth).catch(setError)
      }
    })
  }, [])

  const value = useMemo(() => ({ uid, ready: uid !== null, error }), [uid, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
