// Firebase config 由 env 讀（本地：.env.local；GitHub Actions：repo secrets）。
// 每個值要直接寫 import.meta.env.VITE_...，Vite build 先會代入。
const entries = [
  ['apiKey', 'VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY],
  ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN],
  ['databaseURL', 'VITE_FIREBASE_DATABASE_URL', import.meta.env.VITE_FIREBASE_DATABASE_URL],
  ['projectId', 'VITE_FIREBASE_PROJECT_ID', import.meta.env.VITE_FIREBASE_PROJECT_ID],
  ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET],
  [
    'messagingSenderId',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  ],
  ['appId', 'VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID],
]

export const firebaseConfig = Object.fromEntries(entries.map(([key, , value]) => [key, value]))

/** 未填嘅 env 名，用嚟喺錯誤畫面列出。 */
export const missingConfigKeys = entries.filter(([, , value]) => !value).map(([, envName]) => envName)
