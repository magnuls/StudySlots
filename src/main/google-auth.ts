import { shell } from 'electron'
import * as fs from 'fs'
import * as http from 'http'
import * as path from 'path'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar.events']

interface ClientCredentials {
  client_id: string
  client_secret: string
}

export interface CreateEventOpts {
  summary: string
  description: string
  startISO: string
  endISO: string
}

export class GoogleAuthManager {
  private credentialsPath: string
  private tokenPath: string

  constructor(userDataDir: string) {
    this.credentialsPath = path.join(userDataDir, 'google-credentials.json')
    this.tokenPath = path.join(userDataDir, 'google-token.json')
  }

  // Accepts either a raw {client_id, client_secret} object or the JSON
  // downloaded from Google Cloud Console (which nests under "installed"/"web").
  private readCredentials(): ClientCredentials | null {
    try {
      if (!fs.existsSync(this.credentialsPath)) return null
      const raw = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'))
      const c = raw.installed ?? raw.web ?? raw
      if (!c.client_id || !c.client_secret) return null
      return { client_id: c.client_id, client_secret: c.client_secret }
    } catch {
      return null
    }
  }

  status() {
    return {
      connected: fs.existsSync(this.tokenPath),
      hasCredentials: !!this.readCredentials(),
      credentialsPath: this.credentialsPath,
    }
  }

  connect(): Promise<{ connected: boolean; error?: string }> {
    const creds = this.readCredentials()
    if (!creds) {
      return Promise.resolve({
        connected: false,
        error: `No OAuth client found. Create a "Desktop app" OAuth client in Google Cloud Console and save its JSON to: ${this.credentialsPath}`,
      })
    }

    return new Promise((resolve) => {
      const server = http.createServer()
      server.listen(0, '127.0.0.1', () => {
        const address = server.address()
        if (!address || typeof address === 'string') {
          server.close()
          resolve({ connected: false, error: 'Could not open local callback server' })
          return
        }
        const redirectUri = `http://127.0.0.1:${address.port}/oauth2callback`
        const client = new google.auth.OAuth2(creds.client_id, creds.client_secret, redirectUri)
        const authUrl = client.generateAuthUrl({
          access_type: 'offline',
          prompt: 'consent',
          scope: SCOPES,
        })

        server.on('request', async (req, res) => {
          const url = new URL(req.url ?? '/', redirectUri)
          if (url.pathname !== '/oauth2callback') {
            res.writeHead(404)
            res.end()
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(
            '<body style="font-family:monospace;background:#e6dbff;text-align:center;padding-top:80px">' +
              '<h1>🎰 Study Slots connected!</h1><p>You can close this tab and go spin.</p></body>'
          )
          server.close()

          const code = url.searchParams.get('code')
          if (!code) {
            resolve({ connected: false, error: url.searchParams.get('error') ?? 'No auth code returned' })
            return
          }
          try {
            const { tokens } = await client.getToken(code)
            fs.writeFileSync(this.tokenPath, JSON.stringify(tokens), { mode: 0o600 })
            resolve({ connected: true })
          } catch (e: any) {
            resolve({ connected: false, error: e?.message ?? String(e) })
          }
        })

        shell.openExternal(authUrl)
      })

      server.on('error', (e) => {
        resolve({ connected: false, error: e.message })
      })
    })
  }

  async createEvent(opts: CreateEventOpts): Promise<{ ok: boolean; error?: string; htmlLink?: string }> {
    try {
      const creds = this.readCredentials()
      if (!creds) return { ok: false, error: 'Google credentials not configured' }
      if (!fs.existsSync(this.tokenPath)) return { ok: false, error: 'Not connected to Google Calendar' }

      const client = new google.auth.OAuth2(creds.client_id, creds.client_secret)
      client.setCredentials(JSON.parse(fs.readFileSync(this.tokenPath, 'utf8')))
      client.on('tokens', (tokens) => {
        try {
          const existing = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'))
          fs.writeFileSync(this.tokenPath, JSON.stringify({ ...existing, ...tokens }), { mode: 0o600 })
        } catch {
          /* keep old token file */
        }
      })

      const calendar = google.calendar({ version: 'v3', auth: client })
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: opts.summary,
          description: opts.description,
          start: { dateTime: opts.startISO },
          end: { dateTime: opts.endISO },
        },
      })
      return { ok: true, htmlLink: res.data.htmlLink ?? undefined }
    } catch (e: any) {
      return { ok: false, error: e?.message ?? String(e) }
    }
  }
}
