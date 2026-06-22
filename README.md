# 🎰 Study Slots

> A slot machine desktop app where the slots decide how long you study today.
> Spin the lever, get a duration, book it to your G-Cal, and watch the machine
> become your countdown timer.

Study Slots turns the hardest part of studying — *just starting* — into a game. Set your
minimum and maximum session length, pull the lever, and let the slots commit you to a block of
focused work. When the reels stop, the session is optionally booked to Google Calendar and
the slot machine transforms into a live countdown timer. Some confetti comes down when you're 
done so you're not deepressed that you've been studying for so long.

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

1. **Set bounds** — choose min/max minutes.
2. **Pick a subject and start time.**
3. **Pull the lever** — the reels spin and land on a random duration.
4. **Confirm** — if you want you can book the session to Google Calendar.
5. **Study** — the machine becomes a `MM:SS` countdown you can pause the timer if you want.
6. **Jackpot** — timer finishes.

---

## License

[MIT](./LICENSE)
