import type { Player, MatchResult, ActiveGame, StationId, StationConfig } from './types'
import { STATIONS, GAMES } from './types'
import { AddPlayerForm } from './AddPlayerForm'
import { NowPlayingSection } from './NowPlayingSection'
import { PlayerRow } from './PlayerRow'
import { MatchHistory } from './MatchHistory'

type Props = {
  players: Player[]
  matches: MatchResult[]
  activeGames: ActiveGame[]
  stationConfig: StationConfig
  onAddPlayer: (name: string, tag: string) => void
  onRemovePlayer: (id: string) => void
  onClearGame: (stationId: StationId) => void
  onSubmitResult: (activeGame: ActiveGame) => void
  onToggleRapidZone: () => void
  onToggleGameVisibility: (stationId: string, gameId: string) => void
  onUndoMatch: (matchId: string) => void
  onReset: () => void
  onLogout: () => void
}

export function AdminSettings({
  players,
  matches,
  activeGames,
  stationConfig,
  onAddPlayer,
  onRemovePlayer,
  onClearGame,
  onSubmitResult,
  onToggleRapidZone,
  onToggleGameVisibility,
  onUndoMatch,
  onReset,
  onLogout,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-none mb-1 text-on-background">
            Admin Settings
          </h2>
          <p className="text-on-surface-variant text-sm">Manage players, stations, and games</p>
        </div>
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-[0.65rem] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Active Games management */}
      <NowPlayingSection
        activeGames={activeGames}
        stationConfig={stationConfig}
        players={players}
        isAdmin={true}
        onClearGame={onClearGame}
        onSubmitResult={onSubmitResult}
      />

      {/* Add Player */}
      <section>
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
          Add Player
        </h3>
        <AddPlayerForm onAdd={onAddPlayer} />
      </section>

      {/* Player Management */}
      {players.length > 0 && (
        <section>
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
            Players ({players.length})
          </h3>
          <div className="flex flex-col gap-2">
            {[...players].sort((a, b) => b.elo - a.elo).map((player, i) => (
              <PlayerRow
                key={player.id}
                player={player}
                rank={i + 1}
                isTopFour={i < 4}
                onRemove={onRemovePlayer}
                isAdmin={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Match History */}
      <section>
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
          Match History
        </h3>
        <MatchHistory matches={matches} players={players} onUndo={onUndoMatch} />
      </section>

      {/* Rapid Zone toggle */}
      <section>
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
          Stations
        </h3>
        <button
          onClick={onToggleRapidZone}
          className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
            stationConfig.rapidZoneActive
              ? 'bg-surface-container-high ring-1 ring-primary/40'
              : 'bg-surface-container'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div className="text-left">
              <p className="font-bold text-on-surface">Rapid Zone</p>
              <p className="text-xs text-on-surface-variant">Toggle station visibility</p>
            </div>
          </div>
          <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-all duration-300 ${
            stationConfig.rapidZoneActive ? 'bg-primary justify-end' : 'bg-surface-container-highest justify-start'
          }`}>
            <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
              stationConfig.rapidZoneActive ? 'bg-on-primary' : 'bg-on-surface-variant/50'
            }`} />
          </div>
        </button>
      </section>

      {/* Game visibility per station */}
      <section>
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
          Game Visibility
        </h3>
        <p className="text-on-surface-variant text-xs mb-4">Toggle which games are available at each station</p>

        <div className="space-y-4">
          {STATIONS.filter((s) => s.id !== 'rapid-zone' || stationConfig.rapidZoneActive).map((station) => {
            const allowed = stationConfig.gameVisibility?.[station.id]
            return (
              <div key={station.id} className="bg-surface-container rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{station.emoji}</span>
                  <h4 className="font-bold text-on-surface">{station.name}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GAMES.map((game) => {
                    const isActive = !allowed || allowed.length === 0 || allowed.includes(game.id)
                    return (
                      <button
                        key={game.id}
                        onClick={() => onToggleGameVisibility(station.id, game.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                            : 'bg-surface-container-high text-on-surface-variant/40 line-through'
                        }`}
                      >
                        <span className="text-base">{game.emoji}</span>
                        {game.name}
                        <span className={`material-symbols-outlined text-sm ml-0.5 ${isActive ? 'text-primary' : 'text-on-surface-variant/30'}`}>
                          {isActive ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Reset */}
      <section>
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-3">
          Danger Zone
        </h3>
        <button
          onClick={onReset}
          className="w-full p-4 rounded-2xl bg-error/10 ring-1 ring-error/30 flex items-center gap-3 transition-all hover:bg-error/15 cursor-pointer"
        >
          <span className="material-symbols-outlined text-error text-2xl">warning</span>
          <div className="text-left">
            <p className="font-bold text-error">Reset Everything</p>
            <p className="text-xs text-on-surface-variant">Delete all players, matches, and settings</p>
          </div>
        </button>
      </section>
    </div>
  )
}
