export function NameInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      dir="auto"
      value={value}
      maxLength={24}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[72px] w-full rounded-3xl bg-white/90 px-6 text-2xl font-bold text-center shadow-inner outline-none border-4 border-transparent focus:border-sky placeholder:text-ink/30"
    />
  )
}
