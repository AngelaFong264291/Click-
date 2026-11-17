// 玩家顏色：純演示用，唔屬於計分邏輯。按加入次序（sortedPlayers，包埋離線/已離開嘅玩家）
// 分配 6 個組色其中一個，所以淨係靠 room.players 本身嘅資料，任何裝置計出嚟都一樣，
// 同埋一個玩家全局遊戲都係同一個顏色（離線、離開都唔會影響自己或者其他人嘅顏色）。
import { sortedPlayers } from '../game/room.js'

const COLOR_KEYS = ['red', 'orange', 'yellow', 'green', 'blue', 'pink']

export function playerColorKey(players, uid) {
  const index = sortedPlayers(players).findIndex((p) => p.uid === uid)
  return COLOR_KEYS[index < 0 ? 0 : index % COLOR_KEYS.length]
}

export function playerColorVar(players, uid) {
  return `var(--color-player-${playerColorKey(players, uid)})`
}

export function playerColorTextVar(players, uid) {
  return `var(--color-player-${playerColorKey(players, uid)}-text)`
}
