import { useEffect, useState } from 'react'
import { HOST_GRACE_MS, isMember, shouldClaimHost } from '../game/room.js'
import { claimHost, subscribeRoom, trackPresence } from './rooms.js'

/**
 * 訂閱房間，喺房入面就做 presence，host 離線 5 秒後自動接手（如果輪到自己）。
 * 返回 { room, receivedAt, loading, error }。room 唔存在係 null；receivedAt 係收到資料嘅時間（判斷 8 小時過期用）。
 */
export function useRoom(code, uid) {
  const [state, setState] = useState({ code, room: null, receivedAt: 0, loading: true, error: null })

  useEffect(() => {
    return subscribeRoom(
      code,
      (room) => setState({ code, room, receivedAt: Date.now(), loading: false, error: null }),
      (error) => setState({ code, room: null, receivedAt: Date.now(), loading: false, error }),
    )
  }, [code])

  // 換咗房號但新資料未到，唔好用返舊房間嘅資料
  const current =
    state.code === code ? state : { room: null, receivedAt: 0, loading: true, error: null }
  const room = current.room
  const member = isMember(room, uid)

  useEffect(() => {
    if (!member) return undefined
    return trackPresence(code, uid)
  }, [code, uid, member])

  const host = room?.host ?? null
  const claim = member && shouldClaimHost(room, uid)

  useEffect(() => {
    if (!claim) return undefined
    const timer = setTimeout(() => {
      claimHost(code, uid, host).catch(() => {})
    }, HOST_GRACE_MS)
    return () => clearTimeout(timer)
  }, [code, uid, host, claim])

  return current
}
