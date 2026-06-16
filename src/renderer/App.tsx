import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AnimatedBackground from './components/AnimatedBackground'
import BoundsInput, { Bounds } from './components/BoundsInput'
import Confetti from './components/Confetti'
import MainMenu from './components/MainMenu'
import PixelButton from './components/PixelButton'
import PixelCharacter, { Mood } from './components/PixelCharacter'
import SessionSetup from './components/SessionSetup'
import SlotMachine from './components/SlotMachine'
import Timer from './components/Timer'
import TitleBar from './components/TitleBar'
import { useAudio } from './hooks/useAudio'
import { useCalendar } from './hooks/useCalendar'
import { useTimer } from './hooks/useTimer'

type Phase = 'setup' | 'spinning' | 'result' | 'timer' | 'done'

const BOUNDS_KEY = 'studySlots.bounds'

function loadBounds(): Bounds {
  try {
    const raw = localStorage.getItem(BOUNDS_KEY)
    if (raw) {
      const b = JSON.parse(raw)
      if (typeof b.min === 'number' && typeof b.max === 'number') return b
    }
  } catch {
    /* fall through to defaults */
  }
  return { min: 30, max: 120 }
}

function defaultStartTime() {
  const d = new Date(Date.now() + 5 * 60_000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [bounds, setBounds] = useState<Bounds>(loadBounds)
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState(defaultStartTime)
  const [result, setResult] = useState<number | null>(null)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [booked, setBooked] = useState(false)
  const [mood, setMood] = useState<Mood>('idle')
  const [sparkleKey, setSparkleKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCalSetup, setShowCalSetup] = useState(false)

  // when the timer finishes, the reels first spin to 7-7-7, then spin again
  // to land on the minutes you just studied
  const [celeb, setCeleb] = useState<'sevens' | 'time' | null>(null)
  const [celebSpinning, setCelebSpinning] = useState(false)
  const celebRef = useRef<typeof celeb>(null)
  celebRef.current = celeb

  const audio = useAudio()
  const calendar = useCalendar()

  const onTimerDone = useCallback(() => {
    setPhase('done')
    setMood('cheer')
    audio.playTimerDone()
    setCeleb('sevens')
    setCelebSpinning(true)
  }, [audio])

  const timer = useTimer(onTimerDone)

  // start the background music on the first interaction (the audio context
  // can only start inside a user gesture)
  const unlock = audio.unlock
  useEffect(() => {
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [unlock])

  // Esc toggles the main menu; opening it during a session pauses the timer
  const menuPausedTimer = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const timerRef = useRef(timer)
  timerRef.current = timer

  const toggleMenu = useCallback(() => {
    setMenuOpen((open) => {
      const next = !open
      if (next && phaseRef.current === 'timer' && !timerRef.current.paused) {
        timerRef.current.pause()
        menuPausedTimer.current = true
      }
      if (!next && menuPausedTimer.current) {
        timerRef.current.resume()
        menuPausedTimer.current = false
      }
      return next
    })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleMenu])

  const quit = useCallback(() => {
    if (window.studySlots) window.studySlots.window.close()
    else window.close()
  }, [])

  useEffect(() => {
    localStorage.setItem(BOUNDS_KEY, JSON.stringify(bounds))
  }, [bounds])

  // every valid 15-minute increment within [min, max]
  const durations = useMemo(() => {
    const list: number[] = []
    const first = Math.ceil(bounds.min / 15) * 15
    for (let v = first; v <= bounds.max; v += 15) list.push(v)
    return list
  }, [bounds])

  const boundsValid = durations.length > 0
  const subjectLabel = (subject.trim() || 'STUDYING').toUpperCase()

  const spin = useCallback(() => {
    if (!boundsValid || phase === 'spinning' || phase === 'timer' || celebSpinning) return
    // uniformly random across the valid increments
    const pick = durations[Math.floor(Math.random() * durations.length)]
    setResult(pick)
    setBookingError(null)
    setBooked(false)
    setCeleb(null)
    setPhase('spinning')
    setMood('excited')
    audio.playSpin()
  }, [boundsValid, phase, celebSpinning, durations, audio])

  const handleReelStop = useCallback(
    (index: number) => {
      audio.playReelStop(index)
      if (index !== 2) return

      if (phaseRef.current === 'spinning') {
        setPhase('result')
        setMood('idle')
        setSparkleKey((k) => k + 1)
        audio.playWin()
        return
      }

      // celebration sequence after the timer finishes
      if (phaseRef.current === 'done') {
        setCelebSpinning(false)
        if (celebRef.current === 'sevens') {
          // 7-7-7 just landed — sparkle, then spin again to the studied time
          setSparkleKey((k) => k + 1)
          audio.playWin()
          window.setTimeout(() => {
            setCeleb('time')
            window.setTimeout(() => setCelebSpinning(true), 60)
          }, 900)
        }
      }
    },
    [audio]
  )

  const confirm = useCallback(async () => {
    if (result == null) return
    audio.playClick()
    setBookingError(null)

    if (calendar.connected) {
      setBooking(true)
      const [h, m] = startTime.split(':').map(Number)
      const start = new Date()
      start.setHours(h || 0, m || 0, 0, 0)
      const end = new Date(start.getTime() + result * 60_000)
      const res = await calendar.createEvent({
        summary: `Study: ${subject.trim() || 'Study Session'}`,
        description: 'Assigned by Study Slots 🎰',
        startISO: start.toISOString(),
        endISO: end.toISOString(),
      })
      setBooking(false)
      if (res.ok) setBooked(true)
      else setBookingError(res.error ?? 'Could not create the event')
    }

    timer.start(result * 60)
    setPhase('timer')
    setMood('idle')
  }, [result, calendar, startTime, subject, audio, timer])

  const doneEarly = useCallback(() => {
    audio.playClick()
    timer.stop()
    onTimerDone()
  }, [audio, timer, onTimerDone])

  const reset = useCallback(() => {
    audio.playClick()
    timer.stop()
    setResult(null)
    setBookingError(null)
    setBooked(false)
    setCeleb(null)
    setCelebSpinning(false)
    setPhase('setup')
    setMood('idle')
  }, [audio, timer])

  const onCalendarChip = useCallback(() => {
    audio.playClick()
    if (calendar.connected) return
    if (!calendar.hasCredentials) setShowCalSetup((s) => !s)
    else calendar.connect()
  }, [audio, calendar])

  const timerText =
    phase === 'timer'
      ? {
          mm: String(Math.floor(timer.remaining / 60)).padStart(2, '0'),
          ss: String(timer.remaining % 60).padStart(2, '0'),
        }
      : null

  return (
    <div className="bg-breathe relative flex h-screen w-screen flex-col overflow-hidden font-pixel text-plum">
      {/* black & white pixel frame around the whole app */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div
          className="absolute inset-0"
          style={{
            boxShadow:
              'inset 0 0 0 8px #000, inset 0 0 0 11px #fff, inset 0 0 0 13px rgba(255,255,255,0.45)',
          }}
        />
        {/* two-step pixel corners (small 4px steps for a finer rounding) */}
        <div className="absolute left-0 top-0 h-[10px] w-[14px] bg-black" />
        <div className="absolute left-0 top-0 h-[14px] w-[10px] bg-black" />
        <div className="absolute right-0 top-0 h-[10px] w-[14px] bg-black" />
        <div className="absolute right-0 top-0 h-[14px] w-[10px] bg-black" />
        <div className="absolute bottom-0 left-0 h-[10px] w-[14px] bg-black" />
        <div className="absolute bottom-0 left-0 h-[14px] w-[10px] bg-black" />
        <div className="absolute bottom-0 right-0 h-[10px] w-[14px] bg-black" />
        <div className="absolute bottom-0 right-0 h-[14px] w-[10px] bg-black" />
      </div>
      <AnimatedBackground />
      <TitleBar />
      {phase === 'done' && <Confetti />}

      {menuOpen && (
        <MainMenu
          musicOn={audio.musicOn}
          sfxOn={audio.sfxOn}
          onToggleMusic={audio.toggleMusic}
          onToggleSfx={audio.toggleSfx}
          onResume={toggleMenu}
          onQuit={quit}
        />
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center gap-5 overflow-y-auto px-7 pb-8 pt-4">
        {/* calendar connection chip + menu hint */}
        <div className="flex w-full items-center justify-between">
          <span className="font-pixel text-[7px] text-plum/50">ESC = MENU</span>
          <button
            onClick={onCalendarChip}
            disabled={calendar.connecting}
            className={`pixel-border no-drag px-2 py-1 font-pixel text-[7px] transition-transform hover:scale-105 ${
              calendar.connected ? 'bg-mint text-plumdark' : 'bg-cream text-plum'
            }`}
          >
            {calendar.connected
              ? 'CONNECTED ✓'
              : calendar.connecting
                ? 'CONNECTING…'
                : calendar.hasCredentials
                  ? 'CONNECT GOOGLE CALENDAR'
                  : 'SET UP GOOGLE CALENDAR'}
          </button>
        </div>

        {/* one-time Google OAuth client setup walkthrough */}
        {showCalSetup && !calendar.connected && (
          <div className="pixel-border w-full bg-cream/95 p-3 text-left">
            <div className="font-pixel text-[8px] leading-4 text-plumdark">
              GOOGLE NEEDS YOUR OWN (FREE) OAUTH CLIENT — ONE-TIME SETUP:
            </div>
            <ol className="mt-1 list-decimal pl-4 font-pixel text-[7px] leading-4 text-plum">
              <li>console.cloud.google.com → new project → enable "Google Calendar API"</li>
              <li>OAuth consent screen → External → add yourself as test user</li>
              <li>Credentials → Create OAuth client ID → type "Desktop app"</li>
              <li>Download the JSON, rename it google-credentials.json, drop it in:</li>
            </ol>
            <div className="mt-1 select-text break-all rounded bg-lilac/40 p-1.5 font-mono text-[9px] text-plumdark">
              {calendar.credentialsPath || '(open the app via Electron to see the path)'}
            </div>
            <div className="mt-3 flex gap-5">
              <PixelButton
                variant="mint"
                onClick={calendar.openFolder}
                className="px-3 py-2 text-[8px]"
              >
                Open folder
              </PixelButton>
              <PixelButton
                variant="pink"
                onClick={() => calendar.connect()}
                className="px-3 py-2 text-[8px]"
              >
                I added it — connect
              </PixelButton>
            </div>
          </div>
        )}
        {calendar.error && (
          <div className="w-full break-words text-center font-pixel text-[7px] leading-3 text-[#d6336c]">
            {calendar.error}
          </div>
        )}

        {(phase === 'setup' || phase === 'spinning' || phase === 'result') && (
          <>
            <BoundsInput bounds={bounds} onChange={setBounds} disabled={phase !== 'setup'} />
            <SessionSetup
              subject={subject}
              onSubjectChange={setSubject}
              startTime={startTime}
              onStartTimeChange={setStartTime}
              disabled={phase !== 'setup'}
            />
            {!boundsValid && (
              <div className="font-pixel text-[8px] text-[#d6336c]">
                MIN MUST BE ≤ MAX (15-MIN STEPS)
              </div>
            )}
          </>
        )}

        {/* machine + buddy */}
        <div className="mt-3 flex items-end gap-1">
          <PixelCharacter mood={mood} />
          <SlotMachine
            durations={durations}
            spinning={phase === 'spinning' || celebSpinning}
            result={phase === 'done' && celeb === 'sevens' ? 7 : result}
            timerText={timerText}
            onLever={spin}
            leverDisabled={!boundsValid || phase === 'spinning' || phase === 'timer' || celebSpinning}
            onReelStop={handleReelStop}
            sparkleKey={sparkleKey}
          />
        </div>

        {phase === 'setup' && (
          <PixelButton variant="gold" onClick={spin} disabled={!boundsValid} className="mt-1">
            ★ Spin ★
          </PixelButton>
        )}

        {phase === 'spinning' && (
          <div className="mt-1 font-pixel text-[9px] text-plumdark">ROLLING THE DICE OF FATE…</div>
        )}

        {phase === 'result' && result != null && (
          // clicking the backdrop dismisses the popup and returns to setup
          <div
            className="fixed inset-0 z-30 flex items-center justify-center bg-plumdark/40 p-8"
            onClick={() => {
              if (booking) return
              audio.playClick()
              setPhase('setup')
            }}
          >
            <div
              className="pop-in pixel-border w-full max-w-[420px] bg-gold px-5 py-4 text-center shadow-[0_6px_0_#c98a12]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-pixel text-[15px] leading-7 text-plumdark">
                {result} MINUTES OF {subjectLabel}!
              </div>
              <div className="mt-1 font-pixel text-[8px] text-plumdark/70">
                {calendar.connected
                  ? `BOOKS ${startTime} ON GOOGLE CALENDAR`
                  : 'TIMER ONLY — CALENDAR NOT CONNECTED'}
              </div>
              <div className="mt-5 flex justify-center gap-6">
                <PixelButton variant="pink" onClick={confirm} disabled={booking}>
                  {booking ? 'Booking…' : calendar.connected ? 'Book it!' : 'Start!'}
                </PixelButton>
                <PixelButton variant="mint" onClick={spin} disabled={booking}>
                  Re-spin
                </PixelButton>
              </div>
              <div className="mt-3 font-pixel text-[7px] text-plumdark/60">
                CLICK OUTSIDE TO DISMISS
              </div>
            </div>
          </div>
        )}

        {phase === 'timer' && (
          <div className="mt-1 flex flex-col items-center gap-2">
            {booked && <div className="font-pixel text-[7px] text-plumdark/70">BOOKED ON CALENDAR ✓</div>}
            {bookingError && (
              <div className="w-full break-words text-center font-pixel text-[7px] text-[#d6336c]">
                CALENDAR ERROR: {bookingError}
              </div>
            )}
            <Timer
              paused={timer.paused}
              onPause={() => {
                audio.playClick()
                timer.pause()
              }}
              onResume={() => {
                audio.playClick()
                timer.resume()
              }}
              onDoneEarly={doneEarly}
              subjectLabel={subjectLabel}
            />
          </div>
        )}

        {phase === 'done' && (
          <div className="pop-in pixel-border mt-1 w-full bg-mint px-4 py-3 text-center shadow-[0_6px_0_#3fbd87]">
            <div className="font-pixel text-[13px] leading-6 text-plumdark">★ JACKPOT! ★</div>
            <div className="mt-2 font-pixel text-[9px] leading-5 text-plumdark">
              YOU FINISHED {result ?? '??'} MINUTES OF {subjectLabel}!
            </div>
            <div className="mt-3 flex justify-center">
              <PixelButton variant="gold" onClick={reset}>
                Spin again
              </PixelButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
