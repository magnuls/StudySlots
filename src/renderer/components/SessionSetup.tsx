export default function SessionSetup({
  subject,
  onSubjectChange,
  startTime,
  onStartTimeChange,
  disabled = false,
}: {
  subject: string
  onSubjectChange: (s: string) => void
  startTime: string
  onStartTimeChange: (t: string) => void
  disabled?: boolean
}) {
  return (
    <div className="pixel-border flex w-full flex-col gap-4 bg-babyblue/90 px-4 py-3">
      <label className="flex items-center gap-2 font-pixel text-[8px] text-plumdark">
        <span className="w-16 shrink-0">SUBJECT</span>
        <input
          type="text"
          placeholder="C++ / LeetCode…"
          value={subject}
          disabled={disabled}
          onChange={(e) => onSubjectChange(e.target.value)}
          maxLength={28}
          className="pixel-input min-w-0 flex-1 px-2 py-1"
        />
      </label>
      <label className="flex items-center gap-2 font-pixel text-[8px] text-plumdark">
        <span className="w-16 shrink-0">START</span>
        <input
          type="time"
          value={startTime}
          disabled={disabled}
          onChange={(e) => onStartTimeChange(e.target.value)}
          className="pixel-input w-32 px-2 py-1"
        />
      </label>
    </div>
  )
}
