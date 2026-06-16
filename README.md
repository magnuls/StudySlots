# 🎰 Study Slots

> A pixel-art casino desktop app where a slot machine decides how long you study today.
> Spin the lever, get a duration, book it to your Google Calendar, and watch the machine
> become your countdown timer.

Study Slots turns the hardest part of studying — *just starting* — into a game. Set your
minimum and maximum session length, pull the lever, and let chance commit you to a block of
focused work. When the reels stop, the session is optionally booked to Google Calendar and
the slot machine transforms into a live countdown timer that keeps running even when the
window is minimized. Finish the session and you're rewarded with a chiptune fanfare and
pixel confetti.

---

## Features

- **Slot-machine session picker** — three independently spinning reels land left-to-right on
  a study duration, drawn uniformly at random from the 15-minute increments inside your
  chosen bounds.
- **Google Calendar booking** — connect your calendar and each confirmed spin is written as a
  `Study: {subject}` event via the Google Calendar API.
- **Accurate background timer** — the countdown runs in the Electron **main process**, so it
  keeps perfect time even while the window is minimized or the renderer is throttled by the OS.
- **Pause, resume, or finish early** — full control over a running session, with the timer
  state owned by the main process and mirrored to the UI.
- **Procedural 8-bit audio** — every jingle, reel-stop click, win sting, and the background
  music is generated at runtime with [Tone.js](https://tonejs.dev/). No audio files ship with
  the app.
- **Pixel-art presentation** — animated background, expressive pixel character, a custom
  frameless window with a hand-drawn pixel border, and confetti on completion.
- **Works offline** — Google Calendar is entirely optional. With no setup, Study Slots is a
  fully functional spin-and-study timer.
- **Persisted preferences** — your min/max bounds are saved to `localStorage` between runs.

---

## Tech stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Desktop shell  | [Electron](https://www.electronjs.org/) 33              |
| UI             | [React](https://react.dev/) 18 + TypeScript             |
| Build tooling  | [Vite](https://vite.dev/) 5                             |
| Styling        | [Tailwind CSS](https://tailwindcss.com/) 3 + PostCSS    |
| Audio          | [Tone.js](https://tonejs.dev/) 15                       |
| Calendar API   | [googleapis](https://github.com/googleapis/google-api-nodejs-client) (OAuth 2.0) |

---

## Architecture

Study Slots follows Electron's recommended **secure process model**. The renderer never touches
Node or Electron APIs directly; everything crosses a narrow, typed bridge.

```
┌─────────────────────────────────────────────────────────────┐
│  Main process  (src/main)                                    │
│                                                              │
│   main.ts          window lifecycle, IPC, main-process timer │
│   google-auth.ts   OAuth 2.0 loopback flow + Calendar calls  │
│                                                              │
└───────────────▲──────────────────────────┬──────────────────┘
                │  ipcRenderer / ipcMain     │  contextBridge
                │  (typed channels)          │  (preload.ts)
┌───────────────┴──────────────────────────▼──────────────────┐
│  Renderer process  (src/renderer)                            │
│                                                              │
│   App.tsx          phase state machine (setup → … → done)    │
│   hooks/           useTimer · useCalendar · useAudio         │
│   components/      SlotMachine, Reel, Timer, Confetti, …     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Security model.** The `BrowserWindow` is created with `contextIsolation: true` and
`nodeIntegration: false`. `preload.ts` uses `contextBridge.exposeInMainWorld` to expose only a
small, explicit API (`window.studySlots`) for window controls, the timer, and Google Calendar —
nothing else from Node or Electron is reachable from the page.

**Main-process timer.** Browser timers are throttled when a window is backgrounded, which would
make a study countdown drift. To avoid this, the countdown lives in the main process
(`setInterval` in `main.ts`) and streams `timer:tick` events to the renderer over IPC. The
`useTimer` hook subscribes to those ticks and falls back to a local interval when running
outside Electron (e.g. the Vite dev server in a plain browser).

**State machine.** `App.tsx` drives the whole UI through a small set of phases —
`setup → spinning → result → timer → done` — including pause-on-menu (Esc), an early-finish
path, and a post-session celebration sequence (the reels spin to 7-7-7, then again to the
minutes you just studied).

### Google Calendar OAuth flow

Booking is built directly on `googleapis` with a desktop-friendly **loopback redirect** flow:

1. On **Connect**, the main process starts a temporary `http` server on `127.0.0.1` on a random
   free port and opens the system browser to Google's consent screen.
2. Google redirects back to `http://127.0.0.1:{port}/oauth2callback` with an authorization code.
3. The code is exchanged for tokens, which are written to the app's `userData` directory with
   `0o600` permissions. The refresh token is reused on subsequent launches and auto-refreshed
   via the OAuth client's `tokens` event.
4. Only the minimal **`calendar.events`** scope is requested.

Credentials never leave the user's machine, and the app degrades gracefully to timer-only mode
if no credentials are configured.

---

## Project structure

```
study-slots/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.ts            # window, IPC, background timer
│   │   ├── google-auth.ts     # OAuth 2.0 + Calendar event creation
│   │   └── preload.ts         # contextBridge API surface
│   └── renderer/              # React UI
│       ├── App.tsx            # phase state machine
│       ├── components/        # SlotMachine, Reel, Timer, Confetti, pixel art…
│       ├── hooks/             # useTimer · useCalendar · useAudio
│       └── styles/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig*.json
└── package.json
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Install & run

```bash
npm install
npm run dev      # dev mode: Vite + Electron with hot reload
npm start        # production build, then launch the packaged app
```

### Scripts

| Script          | What it does                                                  |
| --------------- | ------------------------------------------------------------- |
| `npm run dev`   | Runs Vite and Electron together with hot reload               |
| `npm run build` | Type-checks and builds the renderer and main process          |
| `npm start`     | Builds, then launches Electron against the production bundle   |

---

## Google Calendar setup (optional)

The app works without this — you'll just get the timer. To enable calendar booking, you supply
your own free Google OAuth client (one-time):

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Google Calendar API**.
3. Configure the **OAuth consent screen** (External) and add yourself as a test user.
4. Create credentials → **OAuth client ID** → application type **Desktop app**.
5. Download the client JSON, rename it to `google-credentials.json`, and place it in the app's
   `userData` directory (the exact path is shown in-app when you click **Set up Google
   Calendar**). On macOS this is:
   `~/Library/Application Support/study-slots/google-credentials.json`
6. Click **Connect Google Calendar** in the app — your browser opens for consent, and the
   refresh token is stored alongside your credentials.

Only the `calendar.events` scope is requested, and all tokens stay on your machine.

---

## How it works (user flow)

1. **Set bounds** — choose min/max minutes (default 30–120, persisted between runs).
2. **Pick a subject and start time.**
3. **Pull the lever** — the reels spin and land on a random duration in 15-minute steps.
4. **Confirm** — optionally books the session to Google Calendar.
5. **Study** — the machine becomes a `MM:SS` countdown; pause or finish early any time.
6. **Jackpot** — at `00:00`, a chiptune fanfare plays and pixel confetti rains down.

---

## License

[MIT](./LICENSE)
