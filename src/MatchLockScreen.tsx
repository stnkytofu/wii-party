import { useState, useEffect } from 'react'
import type { Player, ActiveGame } from './types'
import { STATIONS, GAMES } from './types'

type Props = {
  activeGame: ActiveGame
  players: Player[]
  onCancel: () => void
  onSubmitResult: () => void
}

function useElapsed(startedAt: number): string {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    const update = () => {
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      if (secs < 60) setElapsed(`${secs}s`)
      else {
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

export function MatchLockScreen({ activeGame, players, onCancel, onSubmitResult }: Props) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const elapsed = useElapsed(activeGame.startedAt)
  const station = STATIONS.find((s) => s.id === activeGame.stationId)!
  const game = GAMES.find((g) => g.id === activeGame.gameId)
  const variant = game?.variants?.find((v) => v.id === activeGame.variantId)
  const gamePlayers = activeGame.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center p-6">
      {/* Pulsing indicator */}
      <div className="flex items-center gap-2 mb-8">
        <span className="w-3 h-3 rounded-full bg-primary animate-pulse" />
        <span className="text-primary text-sm font-bold uppercase tracking-widest">Match In Progress</span>
      </div>

      {/* Station */}
      <span className="text-6xl mb-4">{station.emoji}</span>
      <h2 className="text-2xl font-black text-on-surface mb-1">{station.name}</h2>
      <p className="text-on-surface-variant text-sm mb-8">
        {variant?.emoji ?? game?.emoji} {game?.name}{variant ? ` — ${variant.name}` : ''}
      </p>

      {/* Timer */}
      <div className="bg-surface-container-high rounded-2xl px-8 py-4 mb-8">
        <p className="text-3xl font-black text-primary text-center">{elapsed}</p>
      </div>

      {/* Players */}
      <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-sm">
        {gamePlayers.map((p) => {
          const initials = p.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
          return (
            <div key={p.id} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm">{p.avatar || initials}</span>
              </div>
              <span className="text-sm font-bold text-on-surface">{p.tag}</span>
            </div>
          )
        })}
      </div>

      {/* Submit Results */}
      <button
        onClick={onSubmitResult}
        className="px-8 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:scale-[0.98] active:scale-95 transition-all cursor-pointer mb-8 shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined text-lg">send</span>
        Submit Results
      </button>

      {/* Cancel section */}
      {!showCancelConfirm ? (
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          Cancel Match
        </button>
      ) : (
        <div className="bg-surface-container-high rounded-2xl p-5 w-full max-w-xs text-center animate-slide-up">
          <p className="text-on-surface text-sm font-bold mb-4">Cancel this match for everyone?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-sm font-bold uppercase tracking-widest cursor-pointer"
            >
              No
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-error text-on-error text-sm font-bold uppercase tracking-widest cursor-pointer"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
