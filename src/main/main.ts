import { app, BrowserWindow, ipcMain, shell } from 'electron'
import * as path from 'path'
import { GoogleAuthManager } from './google-auth'

let win: BrowserWindow | null = null
let auth: GoogleAuthManager

// The countdown lives in the main process so it keeps ticking while the
// window is minimized or the renderer is throttled.
let timerInterval: ReturnType<typeof setInterval> | null = null
let remainingSeconds = 0
let timerPaused = false

function sendTick() {
  win?.webContents.send('timer:tick', remainingSeconds)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 620,
    height: 860,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    frame: false,
    // black so the rounded app-frame corners blend into the border
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

function registerIpc() {
  ipcMain.on('window:minimize', () => win?.minimize())
  ipcMain.on('window:close', () => win?.close())

  ipcMain.on('timer:start', (_e, seconds: number) => {
    stopTimer()
    remainingSeconds = Math.max(0, Math.floor(seconds))
    timerPaused = false
    sendTick()
    timerInterval = setInterval(() => {
      if (timerPaused) return
      remainingSeconds -= 1
      if (remainingSeconds <= 0) {
        remainingSeconds = 0
        sendTick()
        stopTimer()
        win?.webContents.send('timer:done')
      } else {
        sendTick()
      }
    }, 1000)
  })

  ipcMain.on('timer:pause', () => {
    timerPaused = true
  })

  ipcMain.on('timer:resume', () => {
    timerPaused = false
  })

  ipcMain.on('timer:stop', () => {
    stopTimer()
    remainingSeconds = 0
  })

  ipcMain.handle('google:status', () => auth.status())
  ipcMain.handle('google:open-folder', () => shell.openPath(app.getPath('userData')))
  ipcMain.handle('google:connect', () => auth.connect())
  ipcMain.handle('calendar:create-event', (_e, opts) => auth.createEvent(opts))
}

app.whenReady().then(() => {
  auth = new GoogleAuthManager(app.getPath('userData'))
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopTimer()
  app.quit()
})
