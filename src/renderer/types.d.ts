export {}

declare global {
  interface Window {
    studySlots?: {
      window: {
        minimize(): void
        close(): void
      }
      timer: {
        start(seconds: number): void
        pause(): void
        resume(): void
        stop(): void
        onTick(cb: (remaining: number) => void): () => void
        onDone(cb: () => void): () => void
      }
      google: {
        status(): Promise<{ connected: boolean; hasCredentials: boolean; credentialsPath: string }>
        openFolder(): Promise<string>
        connect(): Promise<{ connected: boolean; error?: string }>
        createEvent(opts: {
          summary: string
          description: string
          startISO: string
          endISO: string
        }): Promise<{ ok: boolean; error?: string; htmlLink?: string }>
      }
    }
  }
}
