import { useState } from 'react'
import type { Player, MatchResult } from './types'
import { GAMES } from './types'

type Props = {
  matches: MatchResult[]
  players: Player[]
  onUndo: (matchId: string) => void
}

export function MatchHistory({ matches, players, onUndo }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const getPlayer = (id: string) => players.find((p) => p.id === id)

  const sorted = [...matches].sort((a, b) => b.timestamp - a.timestamp)

  if (sorted.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm text-center py-6">No matches yet</p>
    )
  }

  const recent = sorted.slice(0, 5)

  return (
    <div className="flex flex-col gap-3">
      {recent.map((match) => {
        const game = GAMES.find((g) => g.id === match.gameId)
        const variant = game?.variants?.find((v) => v.id === match.variantId)
        const canUndo = !!match.deltas
        const isConfirming = confirmId === match.id

        const placementsSorted = [...match.placements].sort((a, b) => a.position - b.position)

        return (
          <div key={match.id} className="bg-surface-container rounded-2xl p-4">
            {/* Header: game + time */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{variant?.emoji ?? game?.emoji ?? '🎮'}</span>
                <span className="text-sm font-bold text-on-surface">
                  {game?.name ?? match.gameId}
                  {variant ? ` — ${variant.name}` : ''}
                </span>
              </div>
              <span className="text-[0.65rem] text-on-surface-variant">
                {formatTime(match.timestamp)}
              </span>
            </div>

            {/* Placements */}
            <div className="space-y-1.5 mb-3">
              {placementsSorted.map((p) => {
                const player = getPlayer(p.playerId)
                const delta = match.deltas?.[p.playerId]
                const posLabel = p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : p.position === 3 ? '🥉' : `#${p.position}`
                return (
                  <div key={p.playerId} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-center">{posLabel}</span>
                    <span className="flex-1 font-medium text-on-surface truncate">
                      {player?.tag ?? player?.name ?? '???'}
                    </span>
                    {delta !== undefined && (
                      <span className={`text-xs font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta >= 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Undo button */}
            {canUndo && !isConfirming && (
              <button
                onClick={() => setConfirmId(match.id)}
                className="w-full py-2 rounded-xl bg-error/10 text-error text-xs font-bold uppercase tracking-widest hover:bg-error/15 transition-colors cursor-pointer"
              >
                Undo Match
              </button>
            )}
            {!canUndo && (
              <p className="text-[0.6rem] text-on-surface-variant/50 text-center">No deltas stored — cannot undo</p>
            )}

            {/* Confirm undo */}
            {isConfirming && (
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onUndo(match.id); setConfirmId(null) }}
                  className="flex-1 py-2 rounded-xl bg-error text-on-error text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Confirm Undo
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`

  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
