import PixelButton from './PixelButton'

export default function MainMenu({
  musicOn,
  sfxOn,
  onToggleMusic,
  onToggleSfx,
  onResume,
  onQuit,
}: {
  musicOn: boolean
  sfxOn: boolean
  onToggleMusic: () => void
  onToggleSfx: () => void
  onResume: () => void
  onQuit: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-plumdark/60 p-6">
      <div className="pop-in pixel-border w-full max-w-[280px] bg-cream p-5 text-center shadow-[0_8px_0_#b9a8d8]">
        <div className="mb-4 font-pixel text-[14px] text-plumdark">★ MENU ★</div>
        <div className="flex flex-col gap-6">
          <PixelButton variant="gold" onClick={onResume}>
            Resume
          </PixelButton>
          <PixelButton variant="mint" onClick={onToggleMusic}>
            Music: {musicOn ? 'on ♪' : 'off'}
          </PixelButton>
          <PixelButton variant="mint" onClick={onToggleSfx}>
            Sounds: {sfxOn ? 'on ♪' : 'off'}
          </PixelButton>
          <PixelButton variant="pink" onClick={onQuit}>
            Quit
          </PixelButton>
        </div>
        <div className="mt-4 font-pixel text-[7px] text-plum/60">PRESS ESC TO RESUME</div>
      </div>
    </div>
  )
}
