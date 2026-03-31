import type { Player } from './types'

type Props = {
  player: Player
  rank: number
  isTopFour: boolean
  onTapSip: (id: string) => void
  onRemove: (id: string) => void
}

function getRankTitle(rank: number): string {
  if (rank === 1) return 'Grandmaster'
  if (rank <= 3) return 'Challenger'
  if (rank <= 4) return 'Elite'
  return ''
}

function getRankEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return ''
}

export function PlayerRow({
  player,
  rank,
  isTopFour,
  onTapSip,
  onRemove,
}: Props) {
  // Top 1–3: Featured card
  if (rank <= 3) {
    const isFirst = rank === 1
    const titleColor = isFirst ? 'text-secondary' : rank === 2 ? 'text-secondary/70' : 'text-secondary/50'
    const eloColor = isFirst ? 'text-secondary' : 'text-on-surface'
    const avatarStyle = isFirst
      ? 'bg-gradient-to-br from-secondary to-secondary-container shadow-lg'
      : `bg-surface-container-highest ${rank === 2 ? 'border-2 border-secondary/30' : 'border-2 border-secondary/20'}`

    return (
      <div
        className="bg-surface-container-high rounded-lg p-3 sm:p-4 flex items-center gap-3 relative overflow-hidden cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300"
        onClick={() => onTapSip(player.id)}
      >
        {isFirst && <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent opacity-50" />}

        {/* Avatar */}
        <div className={`w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-full flex items-center justify-center relative z-10 ${avatarStyle}`}>
          <span className="text-lg sm:text-xl">{getRankEmoji(rank)}</span>
        </div>

        {/* Name & Title */}
        <div className="flex-1 min-w-0 relative z-10">
          <p className={`${titleColor} font-bold text-[0.6rem] sm:text-xs uppercase tracking-widest`}>
            {getRankTitle(rank)}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-on-surface truncate">{player.name}</h3>
        </div>

        {/* Elo */}
        <div className="text-right relative z-10 shrink-0">
          <p className={`${eloColor} text-xl sm:text-2xl font-black tracking-tighter leading-tight`}>
            {player.elo.toLocaleString()}
          </p>
          <p className="text-on-surface-variant text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider">
            Elo
          </p>
        </div>

        {/* Sip + Remove */}
        <div className="flex flex-col items-center gap-0.5 relative z-10 shrink-0 ml-1">
          <span className="text-secondary/70 text-xs font-bold">🍺{player.sipCount}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(player.id) }}
            className="text-on-surface-variant/30 hover:text-error transition-colors p-0.5"
            aria-label={`Remove ${player.name}`}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    )
  }

  // Top 4: Numbered card
  if (isTopFour) {
    return (
      <div
        className="bg-surface-container-high rounded-lg p-3 sm:p-4 flex items-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-300"
        onClick={() => onTapSip(player.id)}
      >
        <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary/40 font-black text-lg">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-on-surface-variant font-bold text-[0.6rem] sm:text-xs uppercase tracking-widest">
            {getRankTitle(rank)}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-on-surface truncate">{player.name}</h3>
        </div>
        <div className="text-right shrink-0">
          <p className="text-on-surface text-xl sm:text-2xl font-black tracking-tighter leading-tight">
            {player.elo.toLocaleString()}
          </p>
          <p className="text-on-surface-variant text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider">
            Elo
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0 ml-1">
          <span className="text-on-surface-variant/60 text-xs font-bold">🍺{player.sipCount}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(player.id) }}
            className="text-on-surface-variant/30 hover:text-error transition-colors p-0.5"
            aria-label={`Remove ${player.name}`}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    )
  }

  // Rank 5+: Compact row
  return (
    <div
      className="bg-surface-container-low rounded-lg px-3 py-2.5 flex items-center gap-3 hover:bg-surface-container-high transition-colors cursor-pointer"
      onClick={() => onTapSip(player.id)}
    >
      <div className="w-8 h-8 shrink-0 flex items-center justify-center text-on-surface-variant font-bold text-sm">
        {rank}
      </div>
      <h3 className="text-sm font-bold text-on-surface/80 flex-1 min-w-0 truncate">{player.name}</h3>
      <p className="text-primary font-bold text-base tracking-tighter shrink-0">{player.elo.toLocaleString()}</p>
      <span className="text-on-surface-variant/50 text-xs shrink-0">🍺{player.sipCount}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(player.id) }}
        className="text-on-surface-variant/30 hover:text-error transition-colors p-0.5 shrink-0"
        aria-label={`Remove ${player.name}`}
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  )
}
