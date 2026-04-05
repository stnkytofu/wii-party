import { useState, useEffect } from 'react'
import type { Player, ActiveGame, StationId, StationConfig } from './types'
import { STATIONS, GAMES } from './types'

type Props = {
  activeGames: ActiveGame[]
  stationConfig: StationConfig
  players: Player[]
  isAdmin?: boolean
  onClearGame?: (stationId: StationId) => void
  onSubmitResult?: (activeGame: ActiveGame) => void
}

function useElapsed(startedAt: number): string {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      if (secs < 60) {
        setElapsed(`${secs}s`)
      } else {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        setElapsed(`${m}m ${s < 10 ? '0' : ''}${s}s`)
      }
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return elapsed
}

function ActiveStationCard({
  activeGame,
  players,
  isAdmin,
  onClear,
  onSubmit,
}: {
  activeGame: ActiveGame
  players: Player[]
  isAdmin?: boolean
  onClear?: () => void
  onSubmit?: () => void
}) {
  const elapsed = useElapsed(activeGame.startedAt)
  const station = STATIONS.find((s) => s.id === activeGame.stationId)!
  const game = GAMES.find((g) => g.id === activeGame.gameId)
  const variant = game?.variants?.find((v) => v.id === activeGame.variantId)
  const gamePlayers = activeGame.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]

  return (
    <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col gap-3 ring-1 ring-primary/30 shadow-[0_0_20px_rgba(145,247,142,0.07)]">
      {/* Station + game header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{station.emoji}</span>
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">{station.name}</p>
            <p className="text-sm font-black text-on-surface leading-tight">
              {variant?.emoji ?? game?.emoji} {game?.name}{variant ? ` — ${variant.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary text-xs font-bold">{elapsed}</span>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-wrap gap-2">
        {gamePlayers.map((p) => {
          const initials = p.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
          return (
            <div
              key={p.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-surface-container rounded-full"
            >
              <span className="text-sm">{initials}</span>
              <span className="text-xs font-bold text-on-surface">{p.tag}</span>
            </div>
          )
        })}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={onClear}
            className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">close</span>
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-[2] py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:scale-[0.98] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            Submit Result
          </button>
        </div>
      )}
    </div>
  )
}

function IdleStationCard({
  stationId,
}: {
  stationId: StationId
}) {
  const station = STATIONS.find((s) => s.id === stationId)!
  return (
    <div className="bg-surface-container rounded-2xl p-4 flex items-center justify-between opacity-60">
      <div className="flex items-center gap-3">
        <span className="text-xl">{station.emoji}</span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">{station.name}</p>
          <p className="text-xs text-on-surface-variant">Available</p>
        </div>
      </div>
    </div>
  )
}

export function NowPlayingSection({
  activeGames,
  stationConfig,
  players,
  isAdmin,
  onClearGame,
  onSubmitResult,
}: Props) {
  const visibleStations = STATIONS.filter(
    (s) => s.id !== 'rapid-zone' || stationConfig.rapidZoneActive
  )

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          Now Playing
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {visibleStations.map((station) => {
          const active = activeGames.find((g) => g.stationId === station.id)
          if (active) {
            return (
              <ActiveStationCard
                key={station.id}
                activeGame={active}
                players={players}
                isAdmin={isAdmin}
                onClear={() => onClearGame?.(station.id)}
                onSubmit={() => onSubmitResult?.(active)}
              />
            )
          }
          return (
            <IdleStationCard
              key={station.id}
              stationId={station.id}
            />
          )
        })}
      </div>
    </section>
  )
}
