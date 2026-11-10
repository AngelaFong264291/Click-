import { useContext } from 'react'
import { AuthContext } from './authContext.js'

/** 返回 { uid, ready, error }。必須喺 <AuthProvider> 入面用。 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
