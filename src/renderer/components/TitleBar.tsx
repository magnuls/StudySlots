export default function TitleBar() {
  const api = window.studySlots?.window
  return (
    // taller bar with wide padding so the 12px app frame doesn't cover the
    // title text or the minimize/close buttons
    <div className="drag relative z-20 flex h-14 items-center justify-between border-b-4 border-black bg-hotpink pl-6 pr-7 pt-2">
      <span className="font-pixel text-[10px] text-cream">★ STUDY SLOTS ★</span>
      <div className="no-drag flex gap-2">
        <button
          onClick={() => api?.minimize()}
          className="flex h-6 w-6 items-center justify-center border-2 border-black bg-gold font-pixel text-[9px] leading-none text-plumdark transition-transform hover:scale-110 active:scale-90"
          aria-label="minimize"
        >
          _
        </button>
        <button
          onClick={() => api?.close()}
          className="flex h-6 w-6 items-center justify-center border-2 border-black bg-coral font-pixel text-[9px] leading-none text-plumdark transition-transform hover:scale-110 active:scale-90"
          aria-label="close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
