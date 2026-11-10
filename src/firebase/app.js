// 只用 Realtime Database 同 Anonymous Auth，唔用 Analytics。
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { firebaseConfig, missingConfigKeys } from './config.js'

export const firebaseReady = missingConfigKeys.length === 0

const app = firebaseReady ? initializeApp(firebaseConfig) : null

/** config 唔齊時係 null，App 會顯示錯誤畫面，唔會用到。 */
export const auth = app ? getAuth(app) : null
export const db = app ? getDatabase(app) : null
