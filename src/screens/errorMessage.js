import { MAX_PLAYERS, NAME_MAX_LENGTH } from '../game/room.js'

const VARS = {
  full: { max: MAX_PLAYERS },
  nameTooLong: { max: NAME_MAX_LENGTH },
}

/** 錯誤代碼（例如 RoomError.code）→ 翻譯好嘅訊息。 */
export function errorMessage(t, code) {
  return t(`errors.${code}`, VARS[code])
}
