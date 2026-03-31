import type { Player } from './types'
import { PlayerRow } from './PlayerRow'
import { AddPlayerForm } from './AddPlayerForm'

type Props = {
  players: Player[]
  onAddPlayer: (name: string) => void
  onRemovePlayer: (id: string) => void
  onTapSip: (id: string) => void
  onStartMatch: () => void
}

export function Leaderboard({
  players,
  onAddPlayer,
  onRemovePlayer,
  onTapSip,
}: Props) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo)

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-5">
        <h2 className="text-3xl font-extrabold tracking-tight leading-none mb-3 text-on-background">
          Leaderboard
        </h2>
        <div className="flex gap-2">
          <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary">
            Season 1
          </span>
          <span className="bg-surface-container-highest px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Global Rankings
          </span>
        </div>
      </div>

      {/* Add Player Form */}
      <AddPlayerForm onAdd={onAddPlayer} />

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="text-center text-on-surface-variant py-16 text-lg">
          Add players to get started!
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex flex-col gap-3">
        {sorted.map((player, i) => (
          <PlayerRow
            key={player.id}
            player={player}
            rank={i + 1}
            isTopFour={i < 4}
            onTapSip={onTapSip}
            onRemove={onRemovePlayer}
          />
        ))}
      </div>
    </div>
  )
}
