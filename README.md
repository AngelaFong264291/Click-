# 夾唔夾 · Do We Click?

A real-time multiplayer web game for 2–6 people. Friends join the same room via a shared link, answer ten questions together, and see how well they "click." At the end, everyone sees the group's overall compatibility score, a title, and your compatibility ranking with each friend.

The interface supports Traditional Chinese (Cantonese) and English; each player picks their own.

> Under development. Rules and design are in [`docs/`](docs/); development stages and working rules are in [`CLAUDE.md`](CLAUDE.md).

## Tech stack
React + Vite (JavaScript) · Firebase Realtime Database · Firebase Anonymous Auth · Firebase Hosting · Vitest · oxlint

## Local development
Requires Node.js 20 or above.

First-time setup requires Firebase: copy `.env.example` to `.env.local` and fill in the values from Firebase Console → Project settings → Your apps. If any are missing, the app will show you which ones.

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (http://localhost:5173/)
npm run build      # Build to dist/
npm run preview    # Preview the production build
npm test           # Run Vitest once
npm run test:watch # Vitest watch mode
npm run lint       # oxlint
```

## Deployment
Site: https://doweclick.web.app (Firebase Hosting, project `doweclick`)

Pushing to `main` auto-deploys: GitHub Actions (`.github/workflows/firebase-hosting-deploy.yml`) runs `npm ci` → `npm test` → `npm run test:rules` → `npm run build` → deploys `database.rules.json` to Realtime Database → deploys to the Firebase Hosting live channel. The rules deploy runs *before* hosting, so if it fails, hosting is skipped and the live site keeps running on its previous (working) rules instead of new code paired with rejecting rules.

The GitHub repo needs these 8 Actions secrets:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (same as `.env.local`)
- `FIREBASE_SERVICE_ACCOUNT_DOWECLICK` (created via `npx firebase-tools init hosting:github`)

That same service account also needs the **Firebase Realtime Database Admin** IAM role (`roles/firebasedatabase.admin`) added manually, one time, in Google Cloud Console → IAM & Admin → IAM, so it's allowed to deploy database rules in addition to hosting.
