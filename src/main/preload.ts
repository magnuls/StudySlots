import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('studySlots', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    close: () => ipcRenderer.send('window:close'),
  },
  timer: {
    start: (seconds: number) => ipcRenderer.send('timer:start', seconds),
    pause: () => ipcRenderer.send('timer:pause'),
    resume: () => ipcRenderer.send('timer:resume'),
    stop: () => ipcRenderer.send('timer:stop'),
    onTick: (cb: (remaining: number) => void) => {
      const fn = (_e: unknown, remaining: number) => cb(remaining)
      ipcRenderer.on('timer:tick', fn)
      return () => ipcRenderer.removeListener('timer:tick', fn)
    },
    onDone: (cb: () => void) => {
      const fn = () => cb()
      ipcRenderer.on('timer:done', fn)
      return () => ipcRenderer.removeListener('timer:done', fn)
    },
  },
  google: {
    status: () => ipcRenderer.invoke('google:status'),
    openFolder: () => ipcRenderer.invoke('google:open-folder'),
    connect: () => ipcRenderer.invoke('google:connect'),
    createEvent: (opts: unknown) => ipcRenderer.invoke('calendar:create-event', opts),
  },
})
