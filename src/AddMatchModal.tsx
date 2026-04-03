import { useState, useEffect } from 'react'
import type { Player, MatchResult, Placement, StationId, ActiveGame, StationConfig } from './types'
import { GAMES, STATIONS, getGameConfig } from './types'
import { generateId, computeEloDeltas } from './utils'

type Props = {
  players: Player[]
  activeGames: ActiveGame[]
  stationConfig: StationConfig
  currentPlayerId?: string | null
  onSubmit: (result: MatchResult, deltas: Map<string, number>) => void
  onStartGame: (stationId: StationId, gameId: string, variantId: string | null, playerIds: string[], placements?: Placement[]) => void
  onGameStarted: () => void
  onClose: () => void
}

type Step = 'station' | 'game' | 'select' | 'place' | 'results'

type ResultEntry = {
  player: Player
  position: number
  delta: number
}

export function AddMatchModal({ players, activeGames, stationConfig, currentPlayerId, onSubmit, onStartGame, onGameStarted, onClose }: Props) {
  const [step, setStep] = useState<Step>('station')
  const [selectedStationId, setSelectedStationId] = useState<StationId | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (currentPlayerId && players.some((p) => p.id === currentPlayerId)) return [currentPlayerId]
    return []
  })
  const [placements, setPlacements] = useState<Placement[]>([])
  const [resultEntries, setResultEntries] = useState<ResultEntry[]>([])
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [eloDeltas, setEloDeltas] = useState<Map<string, number>>(new Map())
  const [revealedCount, setRevealedCount] = useState(0)

  const config = selectedGameId ? getGameConfig(selectedGameId, selectedVariantId) : { minPlayers: 2, maxPlayers: 4, teamSize: undefined }
  const numTeams = config.teamSize ? Math.floor(config.maxPlayers / config.teamSize) : undefined

  const togglePlayer = (id: string) => {
    if (config.teamSize) {
      // In team mode, deselect = remove from selectedIds + placements
      if (selectedIds.includes(id)) {
        setSelectedIds((prev) => prev.filter((x) => x !== id))
        setPlacements((prev) => prev.filter((p) => p.playerId !== id))
      }
      // Can't add without a team — use assignTeam instead
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : inGamePlayerIds.has(id) ? prev : prev.length < config.maxPlayers ? [...prev, id] : prev
      )
    }
  }

  const assignTeam = (playerId: string, team: number) => {
    if (inGamePlayerIds.has(playerId)) return
    const currentPos = getPositionForPlayer(playerId)
    if (currentPos === team) {
      // Tapping the same team again deselects
      setSelectedIds((prev) => prev.filter((x) => x !== playerId))
      setPlacements((prev) => prev.filter((p) => p.playerId !== playerId))
      return
    }
    // Add to selectedIds if not already there
    if (!selectedIds.includes(playerId)) {
      if (selectedIds.length >= config.maxPlayers) return
      setSelectedIds((prev) => [...prev, playerId])
    }
    // Assign position (team)
    assignPosition(playerId, team)
  }

  const goToPlace = () => {
    if (selectedIds.length < config.minPlayers) return
    // Creating a new game — start it and navigate to lock screen
    if (selectedStationId && selectedGameId) {
      onStartGame(selectedStationId, selectedGameId, selectedVariantId, selectedIds)
    }
    onGameStarted()
  }

  const assignPosition = (playerId: string, position: number) => {
    if (config.teamSize) {
      // Team mode: assign all players with the same position to this position
      // First, remove any existing placement for this player
      let updated = placements.filter((p) => p.playerId !== playerId)
      // Count how many players already have this position (excluding the one we just removed)
      const samePosCnt = updated.filter((p) => p.position === position).length
      if (samePosCnt >= config.teamSize) {
        // Team slot is full—remove the oldest member to make room
        const oldest = updated.find((p) => p.position === position)
        if (oldest) updated = updated.filter((p) => p !== oldest)
      }
      setPlacements([...updated, { playerId, position }])
    } else {
      // FFA: one player per position
      const filtered = placements.filter((p) => p.playerId !== playerId && p.position !== position)
      setPlacements([...filtered, { playerId, position }])
    }
  }

  const getPlayerName = (id: string): string =>
    players.find((p) => p.id === id)?.tag ?? '???'

  const inGamePlayerIds = new Set(activeGames.flatMap((g) => g.playerIds))
  const sortedPlayers = [...players].sort((a, b) => a.tag.localeCompare(b.tag, undefined, { sensitivity: 'base' }))

  const canSubmit =
    placements.length === selectedIds.length &&
    (config.teamSize
      ? new Set(placements.map((p) => p.position)).size === numTeams
      : new Set(placements.map((p) => p.position)).size === selectedIds.length)

  const handleSubmit = () => {
    if (!canSubmit) return
    // Team mode: start the game with placements and go to lock screen
    if (selectedStationId && selectedGameId && step === 'select' && config.teamSize) {
      onStartGame(selectedStationId, selectedGameId, selectedVariantId, selectedIds, placements)
      onGameStarted()
      return
    }

    // Compute deltas first so we can store them with the match
    const tempResult: MatchResult = {
      id: generateId(),
      gameId: selectedGameId!,
      ...(selectedVariantId ? { variantId: selectedVariantId } : {}),
      playerIds: selectedIds,
      placements,
      timestamp: Date.now(),
    }
    const deltas = computeEloDeltas(players, tempResult)

    const result: MatchResult = {
      ...tempResult,
      deltas: Object.fromEntries(deltas),
    }

    setEloDeltas(deltas)
    setMatchResult(result)

    // Build sorted result entries (1st place first)
    const entries: ResultEntry[] = placements
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

  // Staggered reveal animation for results
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

  const getPositionForPlayer = (playerId: string): number | undefined =>
    placements.find((p) => p.playerId === playerId)?.position

  return (
    <div className="space-y-10 animate-slide-up">
      {/* Step Header */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight">
            {step === 'station' ? 'Select Station' : step === 'game' ? 'Select Game' : step === 'select' ? (config.teamSize ? 'Select Teams' : 'Select Players') : step === 'place' ? 'Players & Placements' : 'Match Results'}
          </h2>
          <span className="text-primary text-xs font-bold uppercase tracking-widest">
            Step {step === 'station' ? '1' : step === 'game' ? '2' : step === 'select' ? '3' : step === 'place' ? '4' : config.teamSize ? '4' : '5'}/{config.teamSize ? 4 : 5}
          </span>
        </div>

        {/* Station + game badge shown on later steps */}
        {step !== 'station' && step !== 'game' && selectedStationId && selectedGameId && (() => {
          const station = STATIONS.find((s) => s.id === selectedStationId)
          const game = GAMES.find((g) => g.id === selectedGameId)
          if (!game) return null
          const variant = game.variants?.find((v) => v.id === selectedVariantId)
          return (
            <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-surface-container-high rounded-xl w-fit">
              <span className="text-lg">{station?.emoji}</span>
              <span className="text-sm font-bold text-on-surface">{station?.name}</span>
              <span className="text-on-surface-variant">·</span>
              <span className="text-lg">{variant?.emoji ?? game.emoji}</span>
              <span className="text-sm font-bold text-on-surface">{game.name}{variant ? ` — ${variant.name}` : ''}</span>
            </div>
          )
        })()}

        {step === 'game' && selectedStationId && (() => {
          const station = STATIONS.find((s) => s.id === selectedStationId)
          return (
            <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-surface-container-high rounded-xl w-fit">
              <span className="text-lg">{station?.emoji}</span>
              <span className="text-sm font-bold text-on-surface">{station?.name}</span>
            </div>
          )
        })()}

        {step === 'station' && (
          <>
            <p className="text-on-surface-variant text-sm mb-5">Pick a station for this match</p>
            <div className="flex flex-col gap-3">
              {STATIONS.filter((s) => s.id !== 'rapid-zone' || stationConfig.rapidZoneActive).map((station) => {
                const isSelected = selectedStationId === station.id
                const isOccupied = activeGames.some((g) => g.stationId === station.id)
                return (
                  <button
                    key={station.id}
                    onClick={() => !isOccupied && setSelectedStationId(station.id)}
                    disabled={isOccupied}
                    className={`relative w-full p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 cursor-pointer ${
                      isOccupied
                        ? 'bg-surface-container opacity-40 cursor-not-allowed'
                        : isSelected
                          ? 'bg-surface-container-high ring-2 ring-primary shadow-[0_0_24px_rgba(145,247,142,0.15)]'
                          : 'bg-surface-container-low hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="text-4xl">{station.emoji}</span>
                    <div className="text-left flex-1">
                      <p className={`text-lg font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{station.name}</p>
                      {isOccupied && <p className="text-xs text-on-surface-variant">In use</p>}
                    </div>
                    {isSelected && !isOccupied && (
                      <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                if (!selectedStationId) return
                setStep('game')
              }}
              disabled={!selectedStationId}
              className="w-full mt-6 py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-on-primary-container text-2xl">arrow_forward</span>
              <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase">
                Select Game
              </span>
            </button>
          </>
        )}

        {step === 'game' && (
          <>
            <p className="text-on-surface-variant text-sm mb-5">Choose the game for this match</p>
            <div className="grid grid-cols-2 gap-3">
              {GAMES.filter((game) => {
                const allowed = stationConfig.gameVisibility?.[selectedStationId!]
                return !allowed || allowed.length === 0 || allowed.includes(game.id)
              }).map((game) => {
                const isSelected = selectedGameId === game.id
                return (
                  <button
                    key={game.id}
                    onClick={() => { setSelectedGameId(game.id); setSelectedVariantId(null); setSelectedIds([]) }}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-high ring-2 ring-primary shadow-[0_0_24px_rgba(145,247,142,0.15)]'
                        : 'bg-surface-container-low hover:bg-surface-container-high'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 left-3 material-symbols-outlined text-primary filled text-xl">check_circle</span>
                    )}
                    <span className="text-5xl">{game.emoji}</span>
                    <span className={`text-sm font-bold ${
                      isSelected ? 'text-primary' : 'text-on-surface-variant'
                    }`}>
                      {game.name}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Variant picker — shown when selected game has variants */}
            {selectedGameId && (() => {
              const game = GAMES.find((g) => g.id === selectedGameId)
              if (!game?.variants) return null
              return (
                <div className="mt-5">
                  <p className="text-on-surface-variant text-sm mb-3">Choose a mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    {game.variants.map((v) => {
                      const isActive = selectedVariantId === v.id
                      return (
                        <button
                          key={v.id}
                          onClick={() => { setSelectedVariantId(v.id); setSelectedIds([]) }}
                          className={`rounded-xl py-3 flex flex-col items-center gap-1 transition-all duration-300 cursor-pointer ${
                            isActive
                              ? 'bg-surface-container-high ring-2 ring-primary shadow-[0_0_16px_rgba(145,247,142,0.12)]'
                              : 'bg-surface-container-low hover:bg-surface-container-high'
                          }`}
                        >
                          <span className="text-2xl">{v.emoji}</span>
                          <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{v.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep('station'); setSelectedGameId(null); setSelectedVariantId(null); setSelectedIds([]) }}
                className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
                Back
              </button>
              <button
                onClick={() => {
                  if (!selectedGameId) return
                  const game = GAMES.find((g) => g.id === selectedGameId)
                  if (game?.variants && !selectedVariantId) return
                  setStep('select')
                }}
                disabled={!selectedGameId || !!(GAMES.find((g) => g.id === selectedGameId)?.variants && !selectedVariantId)}
                className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-on-primary-container text-2xl">arrow_forward</span>
                <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase">
                  Select Players
                </span>
              </button>
            </div>
          </>
        )}

        {step === 'select' && config.teamSize ? (
          /* ── Team Select + Assign (combined step) ── */
          <>
            <p className="text-on-surface-variant text-sm mb-5">Assign players to Team Red or Team Blue</p>

            {/* Team summary cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[1, 2].map((teamNum) => {
                const teamColor = teamNum === 1 ? 'red' : 'blue'
                const teamMembers = selectedIds.filter((id) => getPositionForPlayer(id) === teamNum)
                return (
                  <div
                    key={teamNum}
                    className={`rounded-2xl p-4 transition-all duration-300 ${
                      teamNum === 1
                        ? 'bg-red-500/10 ring-1 ring-red-500/30'
                        : 'bg-blue-500/10 ring-1 ring-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-3 h-3 rounded-full ${teamNum === 1 ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <span className={`text-xs font-black uppercase tracking-widest ${teamNum === 1 ? 'text-red-400' : 'text-blue-400'}`}>
                        Team {teamColor}
                      </span>
                      <span className="text-white/30 text-xs ml-auto">{teamMembers.length}/{config.teamSize}</span>
                    </div>
                    <div className="space-y-2 min-h-[3rem]">
                      {teamMembers.length === 0 && (
                        <p className="text-white/20 text-xs italic">No players yet</p>
                      )}
                      {teamMembers.map((id) => (
                        <div key={id} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${teamNum === 1 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                            <span className={`material-symbols-outlined text-sm ${teamNum === 1 ? 'text-red-400' : 'text-blue-400'} filled`}>face</span>
                          </div>
                          <span className="text-sm font-bold text-on-surface">{getPlayerName(id)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* All players with Red / Blue buttons */}
            <div className="space-y-2">
              {sortedPlayers.map((p) => {
                const currentPos = getPositionForPlayer(p.id)
                const teamColor = currentPos === 1 ? 'red' : currentPos === 2 ? 'blue' : null
                const isInGame = inGamePlayerIds.has(p.id)
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl flex items-center justify-between transition-all duration-300 ${
                      teamColor === 'red'
                        ? 'bg-red-500/10 ring-1 ring-red-500/20'
                        : teamColor === 'blue'
                          ? 'bg-blue-500/10 ring-1 ring-blue-500/20'
                          : 'bg-surface-container-low'
                    } ${isInGame && !teamColor ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        teamColor === 'red' ? 'bg-red-500/20 ring-2 ring-red-500' : teamColor === 'blue' ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'bg-white/5'
                      }`}>
                        <span className={`material-symbols-outlined ${
                          teamColor === 'red' ? 'text-red-400' : teamColor === 'blue' ? 'text-blue-400' : 'text-white/40'
                        } filled`}>face</span>
                      </div>
                      <div>
                        <p className="font-bold">{p.tag}</p>
                        <p className={`text-[0.65rem] font-bold uppercase tracking-widest ${
                          isInGame && !teamColor ? 'text-amber-400' : teamColor === 'red' ? 'text-red-400' : teamColor === 'blue' ? 'text-blue-400' : 'text-white/30'
                        }`}>
                          {isInGame && !teamColor ? 'In Game' : teamColor ? `Team ${teamColor}` : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => assignTeam(p.id, 1)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          currentPos === 1
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-red-500/15 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        Red
                      </button>
                      <button
                        onClick={() => assignTeam(p.id, 2)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          currentPos === 2
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        Blue
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setStep('game'); setSelectedIds([]); setPlacements([]); setSelectedVariantId(null)
                }}
                className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-on-primary-container text-2xl">send</span>
                <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase italic">
                  Submit Match
                </span>
              </button>
            </div>
          </>
        ) : step === 'select' && (
          /* ── FFA Player Select ── */
          <>
            <p className="text-on-surface-variant text-sm mb-4">
              {config.minPlayers === config.maxPlayers
                ? `Select exactly ${config.maxPlayers} players`
                : `Tap ${config.minPlayers}–${config.maxPlayers} players to include in this match`}
            </p>
            <div className="space-y-3">
              {sortedPlayers.map((p) => {
                const isSelected = selectedIds.includes(p.id)
                const isInGame = inGamePlayerIds.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all duration-500 cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-high'
                        : 'bg-surface-container-low hover:bg-surface-container-high group'
                    }`}
                  >
                    <div className={`flex items-center gap-4 ${isSelected ? '' : 'opacity-40 group-hover:opacity-100'} transition-opacity`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-white/5'
                      }`}>
                        <span className={`material-symbols-outlined ${isSelected ? 'text-primary filled' : 'text-white'}`}>
                          face
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{p.tag}</p>
                        <p className={`text-xs font-bold uppercase tracking-widest ${
                          isSelected ? 'text-primary' : isInGame ? 'text-amber-400' : 'text-white/50'
                        }`}>
                          {isSelected ? 'Selected' : isInGame ? 'In Game' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-primary filled">check_circle</span>
                    ) : isInGame ? (
                      <span className="material-symbols-outlined text-amber-400 text-xl">sports_esports</span>
                    ) : (
                      <span className="px-6 py-2 rounded-full bg-surface-variant text-xs font-bold uppercase tracking-widest group-hover:bg-primary group-hover:text-on-primary transition-all">
                        Add
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setStep('game'); setSelectedIds([]); setSelectedVariantId(null)
                }}
                className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
                Back
              </button>
              <button
                onClick={goToPlace}
                disabled={selectedIds.length < config.minPlayers}
                className="flex-[2] py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
              >
                <span className="material-symbols-outlined text-on-primary-container text-2xl">arrow_forward</span>
                <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase">
                  Next — Assign Places ({selectedIds.length})
                </span>
              </button>
            </div>
          </>
        )}

        {step === 'place' && (
          <>
            <p className="text-on-surface-variant text-sm mb-4">Assign each player's finishing position</p>
            <div className="space-y-3">
              {selectedIds.map((id) => {
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
                      {Array.from({ length: selectedIds.length }, (_, i) => {
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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setStep('select'); setPlacements([]) }}
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
          </>
        )}

        {step === 'results' && (
          <>
            {/* Winner highlight */}
            {resultEntries.length > 0 && revealedCount > 0 && (() => {
              const winners = config.teamSize
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
                    {config.teamSize ? 'Winning Team 🔴' : 'Winner'}
                  </p>
                  <h3 className="text-2xl font-black text-on-surface">
                    {winners.map((w) => w.player.tag).join(' & ')}
                  </h3>
                </div>
              )
            })()}

            {/* All results */}
            <div className="space-y-3">
              {resultEntries.map((entry, i) => {
                const isRevealed = i < revealedCount
                const isWinner = entry.position === 1
                const initials = entry.player.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
                const posLabel = config.teamSize
                  ? entry.position === 1 ? '🔴' : '🔵'
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
                    {/* Position badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      isWinner
                        ? 'bg-gradient-to-br from-secondary to-secondary-container text-on-secondary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {posLabel}
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      isWinner
                        ? 'bg-secondary/20 ring-2 ring-secondary'
                        : 'bg-surface-container-highest'
                    }`}>
                      <span className="text-lg">{entry.player.avatar || initials}</span>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg text-on-surface truncate">{entry.player.tag}</p>
                      <p className="text-on-surface-variant text-xs truncate">{entry.player.name}</p>
                    </div>

                    {/* ELO change */}
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

            {/* Confirm button — appears after all revealed */}
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
          </>
        )}
      </section>

      {/* Back to Leaderboard link */}
      <button
        onClick={onClose}
        className="text-on-surface-variant/50 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
      >
        ← Back to Leaderboard
      </button>
    </div>
  )
}
