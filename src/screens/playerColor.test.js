import { describe, expect, it } from 'vitest'
import { playerColorKey, playerColorTextVar, playerColorVar } from './playerColor.js'

describe('playerColorKey', () => {
  it('按加入次序分配 6 個組色，跨裝置計出嚟一樣', () => {
    const players = {
      c: { joinedAt: 3, online: true },
      a: { joinedAt: 1, online: true },
      b: { joinedAt: 2, online: true },
    }
    expect(playerColorKey(players, 'a')).toBe('red')
    expect(playerColorKey(players, 'b')).toBe('orange')
    expect(playerColorKey(players, 'c')).toBe('yellow')
  })

  it('離線／已離開嘅玩家一樣計入次序，唔會打亂其他人嘅顏色', () => {
    const players = {
      a: { joinedAt: 1, online: false },
      b: { joinedAt: 2, online: true, left: true },
      c: { joinedAt: 3, online: true },
    }
    expect(playerColorKey(players, 'a')).toBe('red')
    expect(playerColorKey(players, 'b')).toBe('orange')
    expect(playerColorKey(players, 'c')).toBe('yellow')
  })

  it('同一個玩家全局都係同一個顏色，唔受其他人上線/離線影響', () => {
    const base = {
      a: { joinedAt: 1, online: true },
      b: { joinedAt: 2, online: true },
    }
    const laterSnapshot = { ...base, a: { ...base.a, online: false } }
    expect(playerColorKey(base, 'b')).toBe(playerColorKey(laterSnapshot, 'b'))
  })

  it('第 7 個玩家循環用返第一個顏色', () => {
    const players = Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [`u${i}`, { joinedAt: i }]),
    )
    expect(playerColorKey(players, 'u0')).toBe('red')
    expect(playerColorKey(players, 'u6')).toBe('red')
  })

  it('搵唔到嘅 uid 唔會炒，返第一個顏色', () => {
    const players = { a: { joinedAt: 1 } }
    expect(playerColorKey(players, 'ghost')).toBe('red')
  })
})

describe('playerColorVar / playerColorTextVar', () => {
  it('包成 CSS var() 字串', () => {
    const players = { a: { joinedAt: 1 } }
    expect(playerColorVar(players, 'a')).toBe('var(--color-player-red)')
    expect(playerColorTextVar(players, 'a')).toBe('var(--color-player-red-text)')
  })
})
