import { useState, useEffect } from 'react'
import type { Player, ActiveGame, MatchResult, Placement } from './types'
import { STATIONS, GAMES, getGameConfig } from './types'
import { generateId, computeEloDeltas } from './utils'

type Props = {
  activeGame: ActiveGame
  players: Player[]
  onCancel: () => void
  onSubmit: (result: MatchResult, deltas: Map<string, number>) => void
  onClose?: () => void
  startAtSubmit?: boolean
}

type Step = 'playing' | 'place' | 'results'

type ResultEntry = {
  player: Player
  position: number
  delta: number
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

export function MatchLockScreen({ activeGame, players, onCancel, onSubmit, onClose, startAtSubmit }: Props) {
  const [step, setStep] = useState<Step>(startAtSubmit ? 'place' : 'playing')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [winningTeam, setWinningTeam] = useState<number | null>(null)
  const [resultEntries, setResultEntries] = useState<ResultEntry[]>([])
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [eloDeltas, setEloDeltas] = useState<Map<string, number>>(new Map())
  const [revealedCount, setRevealedCount] = useState(0)

  const elapsed = useElapsed(activeGame.startedAt)
  const station = STATIONS.find((s) => s.id === activeGame.stationId)!
  const game = GAMES.find((g) => g.id === activeGame.gameId)
  const variant = game?.variants?.find((v) => v.id === activeGame.variantId)
  const config = game ? getGameConfig(game.id, activeGame.variantId) : { minPlayers: 2, maxPlayers: 4, teamSize: undefined }
  const isTeamMode = !!config.teamSize
  const gamePlayers = activeGame.playerIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as Player[]

  const getPlayerName = (id: string): string =>
    players.find((p) => p.id === id)?.tag ?? '???'

  const assignPosition = (playerId: string, position: number) => {
    const filtered = placements.filter((p) => p.playerId !== playerId && p.position !== position)
    setPlacements([...filtered, { playerId, position }])
  }

  const getPositionForPlayer = (playerId: string): number | undefined =>
    placements.find((p) => p.playerId === playerId)?.position

  const canSubmitFFA = placements.length === activeGame.playerIds.length &&
    new Set(placements.map((p) => p.position)).size === activeGame.playerIds.length
  const canSubmitTeam = winningTeam !== null
  const canSubmit = isTeamMode ? canSubmitTeam : canSubmitFFA

  const handleSubmit = () => {
    if (!canSubmit || !game) return

    let finalPlacements: Placement[]
    if (isTeamMode && activeGame.placements) {
      finalPlacements = activeGame.placements.map((p) => ({
        playerId: p.playerId,
        position: p.position === winningTeam ? 1 : 2,
      }))
    } else {
      finalPlacements = placements
    }

    const tempResult: MatchResult = {
      id: generateId(),
      gameId: activeGame.gameId,
      ...(activeGame.variantId ? { variantId: activeGame.variantId } : {}),
      playerIds: activeGame.playerIds,
      placements: finalPlacements,
      timestamp: Date.now(),
    }
    const deltas = computeEloDeltas(players, tempResult)

    const result: MatchResult = {
      ...tempResult,
      deltas: Object.fromEntries(deltas),
    }

    setEloDeltas(deltas)
    setMatchResult(result)
    const entries: ResultEntry[] = finalPlacements
      .map((p) => ({
        player: players.find((pl) => pl.id === p.playerId)!,
        position: p.position,
        delta: deltas.get(p.playerId) ?? 0,
      }))
      .sort((a, b) => a.position - b.position)
    setResultEntries(entries)
    setRevealedCount(0)
    setStep('results')
  }

  useEffect(() => {
    if (step !== 'results') return
    if (revealedCount >= resultEntries.length) return
    const timer = setTimeout(() => setRevealedCount((c) => c + 1), 350)
    return () => clearTimeout(timer)
  }, [step, revealedCount, resultEntries.length])

  const handleConfirm = () => {
    if (!matchResult) return
    onSubmit(matchResult, eloDeltas)
  }

  const handleBack = () => {
    if (startAtSubmit && onClose) {
      onClose()
    } else {
      setPlacements([])
      setWinningTeam(null)
      setStep('playing')
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center p-6 overflow-auto">
      {step === 'playing' && (
        <>
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
            onClick={() => setStep('place')}
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
        </>
      )}

      {step === 'place' && !isTeamMode && (
        <div className="w-full max-w-md animate-slide-up">
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight mb-2">Assign Places</h2>
          <p className="text-on-surface-variant text-sm mb-6">Assign each player's finishing position</p>

          <div className="space-y-3 mb-6">
            {activeGame.playerIds.map((id) => {
              const currentPos = getPositionForPlayer(id)
              return (
                <div
                  key={id}
                  className="bg-surface-container-high p-4 rounded-xl flex items-center justify-between transition-all duration-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary">
                      <span className="material-symbols-outlined text-primary filled">face</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{getPlayerName(id)}</p>
                      <p className="text-xs text-primary font-bold uppercase tracking-widest">
                        {currentPos ? `${currentPos === 1 ? '1st' : currentPos === 2 ? '2nd' : currentPos === 3 ? '3rd' : '4th'} Place` : 'Unranked'}
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-surface-container p-1 rounded-full gap-1">
                    {Array.from({ length: activeGame.playerIds.length }, (_, i) => {
                      const pos = i + 1
                      const isActive = currentPos === pos
                      let btnStyle = 'text-white/40 hover:text-white'
                      if (isActive && pos === 1) btnStyle = 'bg-secondary text-on-secondary shadow-lg'
                      else if (isActive) btnStyle = 'bg-primary text-on-primary shadow-lg'

                      return (
                        <button
                          key={pos}
                          onClick={() => assignPosition(id, pos)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${btnStyle}`}
                        >
                          {pos}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-[2] py-4 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-on-primary-container text-2xl">send</span>
              <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase italic">
                Submit Results
              </span>
            </button>
          </div>
          <p className="text-center mt-4 text-white/40 text-[0.7rem] uppercase tracking-widest font-bold">
            Review results on the next screen
          </p>
        </div>
      )}

      {step === 'place' && isTeamMode && activeGame.placements && (
        <div className="w-full max-w-md animate-slide-up">
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight mb-2">Who Won?</h2>
          <p className="text-on-surface-variant text-sm mb-6">Select the winning team</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[1, 2].map((teamNum) => {
              const teamColor = teamNum === 1 ? 'red' : 'blue'
              const teamMembers = activeGame.placements!
                .filter((p) => p.position === teamNum)
                .map((p) => players.find((pl) => pl.id === p.playerId))
                .filter(Boolean) as Player[]
              const isSelected = winningTeam === teamNum
              return (
                <button
                  key={teamNum}
                  onClick={() => setWinningTeam(teamNum)}
                  className={`rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? teamNum === 1
                        ? 'bg-red-500/20 ring-2 ring-red-500 shadow-[0_0_24px_rgba(239,68,68,0.2)]'
                        : 'bg-blue-500/20 ring-2 ring-blue-500 shadow-[0_0_24px_rgba(59,130,246,0.2)]'
                      : teamNum === 1
                        ? 'bg-red-500/10 ring-1 ring-red-500/30 hover:bg-red-500/15'
                        : 'bg-blue-500/10 ring-1 ring-blue-500/30 hover:bg-blue-500/15'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full ${teamNum === 1 ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${teamNum === 1 ? 'text-red-400' : 'text-blue-400'}`}>
                      Team {teamColor}
                    </span>
                    {isSelected && (
                      <span className={`material-symbols-outlined text-sm ml-auto filled ${teamNum === 1 ? 'text-red-400' : 'text-blue-400'}`}>
                        emoji_events
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {teamMembers.map((p) => (
                      <div key={p.id} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${teamNum === 1 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                          <span className={`material-symbols-outlined text-sm ${teamNum === 1 ? 'text-red-400' : 'text-blue-400'} filled`}>face</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface">{p.tag}</span>
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-[2] py-4 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-on-primary-container text-2xl">send</span>
              <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase italic">
                Submit Results
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="w-full max-w-md animate-slide-up">
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight mb-6">Match Results</h2>

          {resultEntries.length > 0 && revealedCount > 0 && (() => {
            const winners = isTeamMode
              ? resultEntries.filter((e) => e.position === 1)
              : [resultEntries[0]!]
            return (
              <div className="text-center mb-8 animate-slide-up">
                <div className="flex items-center justify-center gap-3">
                  {winners.map((winner) => {
                    const initials = winner.player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <div key={winner.player.id} className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-secondary-container shadow-[0_0_40px_rgba(145,247,142,0.3)] mb-3">
                        <span className="text-3xl">{winner.player.avatar || initials}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-secondary text-xs font-bold uppercase tracking-[0.25em] mb-1">
                  {isTeamMode ? 'Winning Team' : 'Winner'}
                </p>
                <h3 className="text-2xl font-black text-on-surface">
                  {winners.map((w) => w.player.tag).join(' & ')}
                </h3>
              </div>
            )
          })()}

          <div className="space-y-3">
            {resultEntries.map((entry, i) => {
              const isRevealed = i < revealedCount
              const isWinner = entry.position === 1
              const initials = entry.player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
              const posLabel = isTeamMode
                ? entry.position === 1 ? '🏆' : '💔'
                : entry.position === 1 ? '1st' : entry.position === 2 ? '2nd' : entry.position === 3 ? '3rd' : '4th'
              const deltaSign = entry.delta > 0 ? '+' : ''
              const deltaColor = entry.delta > 0 ? 'text-green-400' : entry.delta < 0 ? 'text-red-400' : 'text-white/50'

              return (
                <div
                  key={entry.player.id}
                  className={`rounded-xl p-4 flex items-center gap-4 transition-all duration-500 ${
                    isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  } ${
                    isWinner
                      ? 'bg-surface-container-high ring-2 ring-secondary/40'
                      : 'bg-surface-container-high'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    isWinner
                      ? 'bg-gradient-to-br from-secondary to-secondary-container text-on-secondary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    {posLabel}
                  </div>

                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    isWinner
                      ? 'bg-secondary/20 ring-2 ring-secondary'
                      : 'bg-surface-container-highest'
                  }`}>
                    <span className="text-lg">{entry.player.avatar || initials}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-on-surface truncate">{entry.player.tag}</p>
                    <p className="text-on-surface-variant text-xs truncate">{entry.player.name}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black ${deltaColor}`}>
                      {deltaSign}{entry.delta}
                    </p>
                    <p className="text-on-surface-variant text-[0.6rem] font-bold uppercase tracking-wider">
                      {entry.player.elo} → {Math.max(0, entry.player.elo + entry.delta)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {revealedCount >= resultEntries.length && (
            <button
              onClick={handleConfirm}
              className="w-full mt-8 py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 animate-slide-up"
            >
              <span className="material-symbols-outlined text-on-primary-container text-2xl">check_circle</span>
              <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase">
                Confirm & Save
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
