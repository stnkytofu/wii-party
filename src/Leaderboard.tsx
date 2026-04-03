import type { Player, ActiveGame, StationConfig } from './types'
import { PlayerRow } from './PlayerRow'
import { NowPlayingSection } from './NowPlayingSection'

type Props = {
  players: Player[]
  activeGames: ActiveGame[]
  stationConfig: StationConfig
}

export function Leaderboard({
  players,
  activeGames,
  stationConfig,
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
      />

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="text-center text-on-surface-variant py-16 text-lg">
          No players yet
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
          />
        ))}
      </div>
    </div>
  )
}
