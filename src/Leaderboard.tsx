import type { Player, ActiveGame, StationId, StationConfig } from './types'
import { PlayerRow } from './PlayerRow'
import { AddPlayerForm } from './AddPlayerForm'
import { NowPlayingSection } from './NowPlayingSection'

type Props = {
  players: Player[]
  activeGames: ActiveGame[]
  stationConfig: StationConfig
  onAddPlayer: (name: string, tag: string) => void
  onRemovePlayer: (id: string) => void
  isAdmin: boolean
  onClearGame: (stationId: StationId) => void
  onSubmitResult: (activeGame: ActiveGame) => void
  onToggleRapidZone: () => void
}

export function Leaderboard({
  players,
  activeGames,
  stationConfig,
  onAddPlayer,
  onRemovePlayer,
  isAdmin,
  onClearGame,
  onSubmitResult,
  onToggleRapidZone,
}: Props) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo)

  return (
    <div>
      {/* Hero Section */}
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight leading-none mb-3 text-on-background">
          Leaderboard
        </h2>
      </div>

      {/* Now Playing */}
      <NowPlayingSection
        activeGames={activeGames}
        stationConfig={stationConfig}
        players={players}
        isAdmin={isAdmin}
        onClearGame={onClearGame}
        onSubmitResult={onSubmitResult}
        onToggleRapidZone={onToggleRapidZone}
      />

      {/* Add Player Form (Admin only) */}
      {isAdmin && <AddPlayerForm onAdd={onAddPlayer} />}

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="text-center text-on-surface-variant py-16 text-lg">
          Add players to get started!
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex flex-col gap-4">
        {sorted.map((player, i) => (
          <PlayerRow
            key={player.id}
            player={player}
            rank={i + 1}
            isTopFour={i < 4}
            onRemove={onRemovePlayer}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}
