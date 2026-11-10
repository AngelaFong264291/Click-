// 記低上次用嘅名，下次自動填入。只記喺自己裝置。
const KEY = 'click.name'

export function loadSavedName() {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(KEY, name)
  } catch {
    // 寫唔到就算
  }
}
