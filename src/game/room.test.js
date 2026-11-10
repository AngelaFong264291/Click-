import { describe, expect, it } from 'vitest'
import {
  MAX_PLAYERS,
  ROOM_REUSE_AFTER_MS,
  canStart,
  generateRoomCode,
  hostIsGone,
  isRoomStale,
  isValidRoomCode,
  joinError,
  nameError,
  pickNextHost,
  shouldClaimHost,
  sortedPlayers,
} from './room.js'

const NOW = 1_800_000_000_000

function makeRoom(overrides = {}) {
  return {
    host: 'a',
    status: 'lobby',
    createdAt: NOW - 1000,
    players: {
      a: { name: 'A', joinedAt: 100, online: true },
      b: { name: 'B', joinedAt: 200, online: true },
    },
    ...overrides,
  }
}

function manyPlayers(n) {
  return Object.fromEntries(
    Array.from({ length: n }, (_, i) => [`p${i}`, { name: `P${i}`, joinedAt: i, online: true }]),
  )
}

describe('房號', () => {
  it('永遠係 4 位數字，前面補 0', () => {
    expect(generateRoomCode(() => 0)).toBe('0000')
    expect(generateRoomCode(() => 0.0042)).toBe('0042')
    expect(generateRoomCode(() => 0.99999)).toBe('9999')
  })

  it('只接受 4 位數字', () => {
    expect(isValidRoomCode('0123')).toBe(true)
    expect(isValidRoomCode('123')).toBe(false)
    expect(isValidRoomCode('12345')).toBe(false)
    expect(isValidRoomCode('12a4')).toBe(false)
    expect(isValidRoomCode(1234)).toBe(false)
  })
})

describe('名字', () => {
  it('一定要填', () => {
    expect(nameError('')).toBe('nameRequired')
    expect(nameError('   ')).toBe('nameRequired')
    expect(nameError(undefined)).toBe('nameRequired')
  })

  it('最多 10 個字（trim 之後計）', () => {
    expect(nameError('一二三四五六七八九十')).toBe(null)
    expect(nameError('  一二三四五六七八九十  ')).toBe(null)
    expect(nameError('一二三四五六七八九十一')).toBe('nameTooLong')
  })
})

describe('房間過期（8 小時後重用）', () => {
  it('8 小時內唔算過期', () => {
    expect(isRoomStale({ createdAt: NOW - ROOM_REUSE_AFTER_MS }, NOW)).toBe(false)
  })

  it('超過 8 小時就過期', () => {
    expect(isRoomStale({ createdAt: NOW - ROOM_REUSE_AFTER_MS - 1 }, NOW)).toBe(true)
  })

  it('唔存在或者冇 createdAt 都當過期', () => {
    expect(isRoomStale(null, NOW)).toBe(true)
    expect(isRoomStale({}, NOW)).toBe(true)
  })
})

describe('joinError', () => {
  it('房唔存在', () => {
    expect(joinError(null, 'c', NOW)).toBe('notFound')
  })

  it('過期嘅房當唔存在', () => {
    expect(joinError(makeRoom({ createdAt: NOW - ROOM_REUSE_AFTER_MS - 1 }), 'c', NOW)).toBe(
      'notFound',
    )
  })

  it('已經開始', () => {
    expect(joinError(makeRoom({ status: 'playing' }), 'c', NOW)).toBe('started')
  })

  it('已經滿人', () => {
    expect(joinError(makeRoom({ players: manyPlayers(MAX_PLAYERS) }), 'c', NOW)).toBe('full')
    expect(joinError(makeRoom({ players: manyPlayers(MAX_PLAYERS - 1) }), 'c', NOW)).toBe(null)
  })

  it('本身已經喺房入面，就算開始咗或者滿人都入到', () => {
    const room = makeRoom({ status: 'playing', players: manyPlayers(MAX_PLAYERS) })
    expect(joinError(room, 'p0', NOW)).toBe(null)
  })
})

describe('host 移交', () => {
  it('sortedPlayers 按加入時間排', () => {
    const players = { z: { joinedAt: 3 }, y: { joinedAt: 1 }, x: { joinedAt: 2 } }
    expect(sortedPlayers(players).map((p) => p.uid)).toEqual(['y', 'x', 'z'])
  })

  it('揀最早加入而又在線嘅玩家，唔計離線嘅同被排除嘅', () => {
    const players = {
      a: { joinedAt: 1, online: false },
      b: { joinedAt: 2, online: true },
      c: { joinedAt: 3, online: true },
    }
    expect(pickNextHost(players, 'x')).toBe('b')
    expect(pickNextHost(players, 'b')).toBe('c')
  })

  it('冇人在線就返回 null', () => {
    expect(pickNextHost({ a: { joinedAt: 1, online: false } }, 'x')).toBe(null)
    expect(pickNextHost(undefined, 'x')).toBe(null)
  })

  it('host 在線就唔使移交', () => {
    expect(hostIsGone(makeRoom())).toBe(false)
    expect(shouldClaimHost(makeRoom(), 'b')).toBe(false)
  })

  it('host 離線：只有最早加入而又在線嗰個要接手', () => {
    const room = makeRoom({
      players: {
        a: { joinedAt: 100, online: false },
        b: { joinedAt: 200, online: true },
        c: { joinedAt: 300, online: true },
      },
    })
    expect(hostIsGone(room)).toBe(true)
    expect(shouldClaimHost(room, 'b')).toBe(true)
    expect(shouldClaimHost(room, 'c')).toBe(false)
  })

  it('host 已經離開房間（entry 冇咗）都要移交', () => {
    const room = makeRoom({ host: 'gone' })
    expect(hostIsGone(room)).toBe(true)
    expect(shouldClaimHost(room, 'a')).toBe(true)
  })
})

describe('canStart', () => {
  it('只有 host、喺大堂、2 人或以上先開始到', () => {
    expect(canStart(makeRoom(), 'a')).toBe(true)
    expect(canStart(makeRoom(), 'b')).toBe(false)
    expect(canStart(makeRoom({ status: 'playing' }), 'a')).toBe(false)
    expect(canStart(makeRoom({ players: manyPlayers(1), host: 'p0' }), 'p0')).toBe(false)
  })
})
