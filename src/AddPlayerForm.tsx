import { useState } from 'react'

type Props = {
  onAdd: (name: string) => void
}

export function AddPlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  return (
    <form className="flex gap-3 mb-6" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Player name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        autoComplete="off"
        className="flex-1 min-w-0 bg-surface-container-high border-2 border-outline-variant rounded-lg text-on-surface px-4 py-3 text-base outline-none transition-colors focus:border-primary placeholder:text-on-surface-variant/50"
      />
      <button
        type="submit"
        disabled={!name.trim()}
        className="bg-primary text-on-primary rounded-lg px-5 py-3 text-base font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all hover:scale-[0.98] active:scale-95 disabled:opacity-40 disabled:cursor-default"
      >
        + Add
      </button>
    </form>
  )
}
