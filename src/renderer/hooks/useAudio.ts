import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'

const PREFS_KEY = 'studySlots.audio'

interface Synths {
  lead: Tone.Synth
  bass: Tone.Synth
}

function loadPrefs(): { music: boolean; sfx: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return { music: p.music !== false, sfx: p.sfx !== false }
    }
  } catch {
    /* fall through to defaults */
  }
  return { music: true, sfx: true }
}

// All audio is procedurally-generated chiptune — square-wave lead +
// triangle-wave bass, no samples. SFX play one-shot; the background music is
// a gentle looping melody on Tone's transport.
export function useAudio() {
  const [prefs, setPrefs] = useState(loadPrefs)
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs

  const synthsRef = useRef<Synths | null>(null)
  const musicBuilt = useRef(false)

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  }, [prefs])

  const ensure = useCallback(async (): Promise<Synths> => {
    await Tone.start()
    if (!synthsRef.current) {
      const lead = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0.15, release: 0.06 },
        volume: -14,
      }).toDestination()
      const bass = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.1 },
        volume: -10,
      }).toDestination()
      synthsRef.current = { lead, bass }
    }
    return synthsRef.current
  }, [])

  // quiet, cutesy two-bar loop in C major
  const buildMusic = useCallback(() => {
    if (musicBuilt.current) return
    musicBuilt.current = true

    const musicLead = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.25, release: 0.15 },
      volume: -27,
    }).toDestination()
    const musicBass = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.2 },
      volume: -23,
    }).toDestination()

    const melody: Array<string | null> = [
      'E5', 'G5', 'A5', 'G5', 'C6', null, 'G5', null,
      'A5', 'G5', 'E5', 'G5', 'D5', 'E5', 'C5', null,
    ]
    new Tone.Sequence(
      (time, note) => {
        if (note) musicLead.triggerAttackRelease(note, '16n', time)
      },
      melody,
      '8n'
    ).start(0)

    new Tone.Sequence(
      (time, note) => {
        if (note) musicBass.triggerAttackRelease(note, '8n', time)
      },
      ['C3', 'G2', 'A2', 'F2', 'C3', 'G2', 'F2', 'G2'],
      '4n'
    ).start(0)

    Tone.getTransport().bpm.value = 108
  }, [])

  const startMusic = useCallback(async () => {
    try {
      await Tone.start()
      buildMusic()
      Tone.getTransport().start()
    } catch {
      /* audio not available */
    }
  }, [buildMusic])

  const stopMusic = useCallback(() => {
    Tone.getTransport().pause()
  }, [])

  // Called once on the first user gesture — browsers/Electron require a
  // gesture before the audio context may start.
  const unlock = useCallback(async () => {
    try {
      await Tone.start()
      if (prefsRef.current.music) {
        buildMusic()
        Tone.getTransport().start()
      }
    } catch {
      /* audio not available */
    }
  }, [buildMusic])

  const toggleMusic = useCallback(() => {
    setPrefs((p) => {
      const next = { ...p, music: !p.music }
      if (next.music) startMusic()
      else stopMusic()
      return next
    })
  }, [startMusic, stopMusic])

  const toggleSfx = useCallback(() => {
    setPrefs((p) => ({ ...p, sfx: !p.sfx }))
  }, [])

  return useMemo(() => {
    function play(fn: (s: Synths, now: number) => void) {
      if (!prefsRef.current.sfx) return
      ensure()
        .then((s) => fn(s, Tone.now()))
        .catch(() => {
          /* audio not available — stay silent */
        })
    }

    return {
      musicOn: prefs.music,
      sfxOn: prefs.sfx,
      toggleMusic,
      toggleSfx,
      unlock,

      playClick() {
        play(({ lead }, now) => lead.triggerAttackRelease('C6', '32n', now))
      },

      // rising arcade run while the reels start spinning
      playSpin() {
        play(({ lead, bass }, now) => {
          const run = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6']
          run.forEach((n, i) => lead.triggerAttackRelease(n, '32n', now + i * 0.055))
          bass.triggerAttackRelease('C3', '8n', now)
          bass.triggerAttackRelease('G3', '8n', now + 0.28)
        })
      },

      // each reel locks in with a rising blip
      playReelStop(index: number) {
        play(({ lead }, now) => {
          const notes = ['E5', 'G5', 'C6']
          lead.triggerAttackRelease(notes[index % notes.length], '16n', now)
        })
      },

      // little jackpot jingle when the result lands
      playWin() {
        play(({ lead, bass }, now) => {
          const tune: Array<[string, number]> = [
            ['C5', 0],
            ['E5', 0.09],
            ['G5', 0.18],
            ['C6', 0.27],
            ['G5', 0.4],
            ['C6', 0.5],
          ]
          tune.forEach(([n, t]) => lead.triggerAttackRelease(n, '16n', now + t))
          bass.triggerAttackRelease('C3', '8n', now)
          bass.triggerAttackRelease('G2', '8n', now + 0.27)
          bass.triggerAttackRelease('C3', '4n', now + 0.5)
        })
      },

      // longer victory fanfare when the timer hits 00:00
      playTimerDone() {
        play(({ lead, bass }, now) => {
          const tune: Array<[string, string, number]> = [
            ['G5', '16n', 0],
            ['G5', '16n', 0.12],
            ['G5', '16n', 0.24],
            ['A5', '8n', 0.36],
            ['C6', '8n', 0.56],
            ['A5', '16n', 0.76],
            ['C6', '8n', 0.88],
            ['E6', '8n', 1.08],
            ['G6', '4n', 1.28],
          ]
          tune.forEach(([n, d, t]) => lead.triggerAttackRelease(n, d, now + t))
          const bassline: Array<[string, number]> = [
            ['C3', 0],
            ['G3', 0.36],
            ['A3', 0.76],
            ['C3', 1.28],
          ]
          bassline.forEach(([n, t]) => bass.triggerAttackRelease(n, '8n', now + t))
        })
      },
    }
  }, [prefs.music, prefs.sfx, toggleMusic, toggleSfx, unlock, ensure])
}

export type AudioApi = ReturnType<typeof useAudio>
