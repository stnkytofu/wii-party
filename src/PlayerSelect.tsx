import type { Player } from './types'

type Props = {
  players: Player[]
  onSelect: (id: string) => void
}

export function PlayerSelect({ players, onSelect }: Props) {
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <span className="material-symbols-outlined text-primary text-6xl mb-4">sports_esports</span>
        <h2 className="text-2xl font-bold mb-2">No players yet</h2>
        <p className="text-on-surface-variant">Ask the admin to add players first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center px-5 pt-10">
      <span className="material-symbols-outlined text-primary text-5xl mb-3">sports_esports</span>
      <h2 className="text-2xl font-bold font-headline mb-1">Player List</h2>
      <p className="text-on-surface-variant text-sm mb-8">Tap your name to log in</p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelect(player.id)}
            className="w-full bg-surface-container-high hover:bg-surface-container-highest p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {player.avatar
                ? <span className="text-2xl">{player.avatar}</span>
                : <span className="material-symbols-outlined text-primary">face</span>
              }
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-lg">{player.tag}</p>
              <p className="text-on-surface-variant text-xs">{player.name}</p>
            </div>
            <span className="material-symbols-outlined text-white/20">arrow_forward_ios</span>
          </button>
        ))}
      </div>
    </div>
  )
}
