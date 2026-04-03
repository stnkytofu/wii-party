import { useState } from 'react'
import type { Player } from './types'

type Props = {
  player: Player
  rank: number
  isTopFour: boolean
  onRemove?: (id: string) => void
  isAdmin?: boolean
}

export function PlayerRow({
  player,
  rank,
  isTopFour,
  onRemove,
  isAdmin,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  const streakBadge = player.streak >= 3 && (
    <span className="inline-flex items-center gap-0.5 text-sm font-bold text-amber-400 animate-pulse">
      🔥{player.streak}
    </span>
  )

  const deleteButton = isAdmin && onRemove && (
    <div className="relative z-10 shrink-0 ml-1">
      <button
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true) }}
        className="text-on-surface-variant/30 hover:text-error transition-colors p-0.5"
        aria-label={`Remove ${player.name}`}
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  )

  const confirmDialog = showConfirm && (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowConfirm(false)}>
      <div className="bg-surface-container-high rounded-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
        <span className="material-symbols-outlined text-error text-4xl mb-2">delete</span>
        <h3 className="text-lg font-bold text-on-surface mb-1">Remove Player</h3>
        <p className="text-on-surface-variant text-sm mb-5">
          Remove <span className="font-bold text-on-surface">{player.tag}</span> from the leaderboard?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest bg-surface-container text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onRemove?.(player.id); setShowConfirm(false) }}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest bg-error text-on-error hover:opacity-90 transition-opacity"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )

  // Top 1–3: Featured card
  if (rank <= 3) {
    const isFirst = rank === 1
    const eloColor = isFirst ? 'text-secondary' : 'text-on-surface'
    const initials = player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    const avatarStyle = isFirst
      ? 'bg-gradient-to-br from-secondary to-secondary-container shadow-lg'
      : `bg-surface-container-highest ${rank === 2 ? 'border-2 border-secondary/30' : 'border-2 border-secondary/20'}`

    return (
      <>
        {confirmDialog}
        <div
          className="bg-surface-container-high rounded-lg p-3 sm:p-4 flex items-center gap-3 relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300"
        >
          {isFirst && <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent opacity-50" />}

          {/* Rank + Avatar */}
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <span className="text-lg sm:text-xl font-black text-on-surface-variant w-5 text-center">{rank}</span>
            <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${avatarStyle}`}>
              <span className="text-lg sm:text-xl">{player.avatar || initials}</span>
            </div>
          </div>

          {/* Name & Title */}
          <div className="flex-1 min-w-0 relative z-10">
            <h3 className="text-lg sm:text-xl font-bold text-on-surface truncate">{player.tag} {streakBadge}</h3>
            <p className="text-on-surface-variant text-xs sm:text-sm truncate">{player.name}</p>
          </div>

          {/* Elo */}
          <div className="text-right relative z-10 shrink-0">
            <p className={`${eloColor} text-xl sm:text-2xl font-black tracking-tighter leading-tight`}>
              {player.elo.toLocaleString()}
            </p>
          </div>

          {deleteButton}
        </div>
      </>
    )
  }

  // Top 4: Numbered card
  if (isTopFour) {
    return (
      <>
        {confirmDialog}
        <div
          className="bg-surface-container-high rounded-lg p-3 sm:p-4 flex items-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300"
        >
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-black text-on-surface-variant w-5 text-center">{rank}</span>
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-surface-container-highest flex items-center justify-center text-lg">
              {player.avatar || player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-on-surface truncate">{player.tag} {streakBadge}</h3>
            <p className="text-on-surface-variant text-xs sm:text-sm truncate">{player.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-on-surface text-xl sm:text-2xl font-black tracking-tighter leading-tight">
              {player.elo.toLocaleString()}
            </p>
            <p className="text-on-surface-variant text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider">
              Elo
            </p>
          </div>
          {deleteButton}
        </div>
      </>
    )
  }

  // Rank 5+: Compact row
  return (
    <>
      {confirmDialog}
      <div
        className="bg-surface-container-low rounded-lg px-3 py-2.5 flex items-center gap-3 hover:bg-surface-container-high transition-colors"
      >
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-on-surface-variant w-5 text-center">{rank}</span>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-sm">
            {player.avatar || player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-on-surface/80 truncate">{player.tag} {streakBadge}</h3>
          <p className="text-on-surface-variant text-xs truncate">{player.name}</p>
        </div>
        <p className="text-primary font-bold text-base tracking-tighter shrink-0">{player.elo.toLocaleString()}</p>
        {deleteButton}
      </div>
    </>
  )
}
