import { useState } from 'react'

type Props = {
  onAdd: (name: string, tag: string) => void
}

export function AddPlayerForm({ onAdd }: Props) {
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedTag = tag.trim()
    if (!trimmedName || !trimmedTag) return
    onAdd(trimmedName, trimmedTag)
    setName('')
    setTag('')
  }

  return (
    <form className="flex flex-col gap-3 mb-8" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
          className="flex-1 min-w-0 bg-surface-container-high border-2 border-outline-variant rounded-lg text-on-surface px-4 py-3 text-base outline-none transition-colors focus:border-primary placeholder:text-on-surface-variant/50"
        />
        <input
          type="text"
          placeholder="Player tag..."
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          maxLength={20}
          autoComplete="off"
          className="flex-1 min-w-0 bg-surface-container-high border-2 border-outline-variant rounded-lg text-on-surface px-4 py-3 text-base outline-none transition-colors focus:border-primary placeholder:text-on-surface-variant/50"
        />
      </div>
      <button
        type="submit"
        disabled={!name.trim() || !tag.trim()}
        className="bg-primary text-on-primary rounded-lg px-5 py-3 text-base font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all hover:scale-[0.98] active:scale-95 disabled:opacity-40 disabled:cursor-default"
      >
        + Add Player
      </button>
    </form>
  )
}
