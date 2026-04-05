import { useState, useEffect, useCallback, useRef } from 'react'
import type { Player, MatchResult, Placement, Screen, ActiveGame, StationId, StationConfig } from './types'
import { GAMES } from './types'
import { createPlayer, applyMatchResults } from './utils'
import { Leaderboard } from './Leaderboard'
import { AddMatchModal } from './AddMatchModal'
import { MatchLockScreen } from './MatchLockScreen'
import { PlayerSelect } from './PlayerSelect'
import { AdminSettings } from './AdminSettings'
import {
  writePlayers, writeMatches, onPlayersChange, onMatchesChange,
  writeActiveGames, onActiveGamesChange,
  writeStationConfig, onStationConfigChange,
} from './firebase'

const ADMIN_PIN = '0000'

export default function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([])
  const [stationConfig, setStationConfig] = useState<StationConfig>({ rapidZoneActive: false })
  const [screen, setScreen] = useState<Screen>('leaderboard')
  const [adminSubmitGame, setAdminSubmitGame] = useState<ActiveGame | null>(null)
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('wii-party-admin') === 'true'
  })
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('wii-party-player-id')
  })
  const [showPinInput, setShowPinInput] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [managingStationId, setManagingStationId] = useState<StationId | null>(null)

  // Track whether a change is local (we wrote it) vs remote (Firebase pushed it)
  const isLocalUpdate = useRef(false)

  // Subscribe to real-time Firebase data on mount
  useEffect(() => {
    const unsubPlayers = onPlayersChange((data) => {
      if (!isLocalUpdate.current) {
        setPlayers(data)
      }
      isLocalUpdate.current = false
    })
    const unsubMatches = onMatchesChange((data) => {
      if (!isLocalUpdate.current) {
        setMatches(data)
      }
      isLocalUpdate.current = false
    })
    const unsubActiveGames = onActiveGamesChange(setActiveGames)
    const unsubStationConfig = onStationConfigChange(setStationConfig)
    return () => { unsubPlayers(); unsubMatches(); unsubActiveGames(); unsubStationConfig() }
  }, [])

  // Helper: update players locally + push to Firebase
  const updatePlayers = useCallback((updater: (prev: Player[]) => Player[]) => {
    setPlayers((prev) => {
      const next = updater(prev)
      isLocalUpdate.current = true
      writePlayers(next)
      return next
    })
  }, [])

  // Helper: update matches locally + push to Firebase
  const updateMatches = useCallback((updater: (prev: MatchResult[]) => MatchResult[]) => {
    setMatches((prev) => {
      const next = updater(prev)
      isLocalUpdate.current = true
      writeMatches(next)
      return next
    })
  }, [])

  const handleAddPlayer = useCallback((name: string, tag: string) => {
    updatePlayers((prev) => [...prev, createPlayer(name, tag)])
  }, [updatePlayers])

  const handleRemovePlayer = useCallback((id: string) => {
    updatePlayers((prev) => prev.filter((p) => p.id !== id))
  }, [updatePlayers])

  const handleUndoMatch = useCallback((matchId: string) => {
    setMatches((prevMatches) => {
      const match = prevMatches.find((m) => m.id === matchId)
      if (!match?.deltas) return prevMatches
      // Reverse the ELO deltas
      updatePlayers((prev) =>
        prev.map((player) => {
          const delta = match.deltas![player.id]
          if (delta === undefined) return player
          // Reverse streak: if they won (pos 1), decrement; otherwise we can't perfectly restore
          const pos = match.placements.find((p) => p.playerId === player.id)?.position
          const newStreak = pos === 1 ? Math.max(0, player.streak - 1) : player.streak
          return { ...player, elo: Math.max(0, player.elo - delta), streak: newStreak }
        })
      )
      const next = prevMatches.filter((m) => m.id !== matchId)
      isLocalUpdate.current = true
      writeMatches(next)
      return next
    })
  }, [updatePlayers])

  const handleMatchSubmit = useCallback(
    (result: MatchResult, deltas: Map<string, number>) => {
      updatePlayers((prev) => applyMatchResults(prev, result, deltas))
      updateMatches((prev) => [...prev, result])
      // Clear the active game that matches the submitted players
      setActiveGames((cur) => {
        const stationToClear = managingStationId
          ?? cur.find((g) => result.playerIds.every((id) => g.playerIds.includes(id)))?.stationId
        if (stationToClear) {
          const next = cur.filter((g) => g.stationId !== stationToClear)
          writeActiveGames(next)
          return next
        }
        return cur
      })
      setAdminSubmitGame(null)
      setManagingStationId(null)
      setScreen('leaderboard')
    },
    [updatePlayers, updateMatches, managingStationId]
  )

  const handleStartGame = useCallback((stationId: StationId, gameId: string, variantId: string | null, playerIds: string[], placements?: Placement[]) => {
    const newGame: ActiveGame = { stationId, gameId, variantId, playerIds, ...(placements ? { placements } : {}), startedAt: Date.now() }
    setActiveGames((prev) => {
      const next = [...prev.filter((g) => g.stationId !== stationId), newGame]
      writeActiveGames(next)
      return next
    })
    setManagingStationId(stationId)
  }, [])

  const handleClearGame = useCallback((stationId: StationId) => {
    setActiveGames((prev) => {
      const next = prev.filter((g) => g.stationId !== stationId)
      writeActiveGames(next)
      return next
    })
  }, [])

  const handleSubmitResult = useCallback((activeGame: ActiveGame) => {
    setAdminSubmitGame(activeGame)
  }, [])

  const handleToggleRapidZone = useCallback(() => {
    setStationConfig((prev) => {
      const next = { ...prev, rapidZoneActive: !prev.rapidZoneActive }
      writeStationConfig(next)
      return next
    })
  }, [])

  const handleToggleGameVisibility = useCallback((stationId: string, gameId: string) => {
    setStationConfig((prev) => {
      const vis = { ...(prev.gameVisibility ?? {}) }
      const allIds = GAMES.map((g) => g.id)
      const current = vis[stationId] ?? [...allIds] // default = all enabled
      vis[stationId] = current.includes(gameId)
        ? current.filter((id) => id !== gameId)
        : [...current, gameId]
      const next = { ...prev, gameVisibility: vis }
      writeStationConfig(next)
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    isLocalUpdate.current = true
    writePlayers([])
    isLocalUpdate.current = true
    writeMatches([])
    writeActiveGames([])
    writeStationConfig({ rapidZoneActive: false, gameVisibility: {} })
    setPlayers([])
    setMatches([])
    setActiveGames([])
    setStationConfig({ rapidZoneActive: false, gameVisibility: {} })
  }, [])

  const handlePinSubmit = () => {
    if (pinValue === ADMIN_PIN) {
      setIsAdmin(true)
      localStorage.setItem('wii-party-admin', 'true')
      setShowPinInput(false)
      setPinValue('')
      setScreen('admin')
    } else {
      setPinValue('')
    }
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem('wii-party-admin')
  }

  const handlePlayerSelect = (id: string) => {
    setCurrentPlayerId(id)
    localStorage.setItem('wii-party-player-id', id)
  }

  const handlePlayerLogout = () => {
    setCurrentPlayerId(null)
    localStorage.removeItem('wii-party-player-id')
  }

  // Detect external match cancellation (another player cancelled the match)
  useEffect(() => {
    if (managingStationId && screen === 'addMatch') {
      const gameStillExists = activeGames.some((g) => g.stationId === managingStationId)
      if (!gameStillExists) {
        setManagingStationId(null)
        setScreen('leaderboard')
      }
    }
    // Also clear admin submit overlay if that game was cancelled
    if (adminSubmitGame && !activeGames.some((g) => g.stationId === adminSubmitGame.stationId)) {
      setAdminSubmitGame(null)
    }
  }, [activeGames, managingStationId, screen, adminSubmitGame])

  // Check if current player is locked in an active match
  const myActiveGame = !isAdmin && currentPlayerId
    ? activeGames.find((g) => g.playerIds.includes(currentPlayerId))
    : null
  const showLockScreen = myActiveGame && screen !== 'addMatch'

  // If not logged in as a player (and not admin), show player select
  if (!isAdmin && !currentPlayerId) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 w-full z-50 bg-[#0e0e0e] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between px-5 h-14">
            <button
              onClick={() => setShowPinInput(true)}
              className="flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-primary text-2xl">sports_esports</span>
              <h1 className="font-headline text-lg font-bold tracking-tight text-primary">Wii Party</h1>
            </button>
          </div>
        </header>
        <PlayerSelect players={players} onSelect={handlePlayerSelect} />

        {/* PIN Modal */}
        {showPinInput && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6" onClick={() => { setShowPinInput(false); setPinValue('') }}>
            <div className="bg-surface-container-high rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4 text-center">Admin PIN</h3>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                className="w-full bg-surface-container border-2 border-outline-variant rounded-lg text-center text-2xl tracking-[0.5em] px-4 py-3 outline-none focus:border-primary text-on-surface"
                autoFocus
                placeholder="····"
              />
              <button
                onClick={handlePinSubmit}
                disabled={pinValue.length < 4}
                className="w-full mt-4 py-3 bg-primary text-on-primary rounded-lg font-bold uppercase tracking-widest text-sm disabled:opacity-30"
              >
                Unlock
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-50 bg-[#0e0e0e] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">sports_esports</span>
            <h1 className="font-headline text-lg font-bold tracking-tight text-primary">Wii Party</h1>
          </div>
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <button
                onClick={handlePlayerLogout}
                className="text-white/50 font-bold uppercase tracking-widest text-[0.6rem]"
              >
                Switch
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PIN Modal */}
      {showPinInput && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6" onClick={() => { setShowPinInput(false); setPinValue('') }}>
          <div className="bg-surface-container-high rounded-2xl p-6 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-center">Admin PIN</h3>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              className="w-full bg-surface-container border-2 border-outline-variant rounded-lg text-center text-2xl tracking-[0.5em] px-4 py-3 outline-none focus:border-primary text-on-surface"
              autoFocus
              placeholder="····"
            />
            <button
              onClick={handlePinSubmit}
              disabled={pinValue.length < 4}
              className="w-full mt-4 py-3 bg-primary text-on-primary rounded-lg font-bold uppercase tracking-widest text-sm disabled:opacity-30"
            >
              Unlock
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-surface-container-high rounded-2xl p-6 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-error text-4xl mb-2">warning</span>
            <h3 className="text-lg font-bold text-on-surface mb-1">Reset Everything</h3>
            <p className="text-on-surface-variant text-sm mb-4">
              This will delete all players and matches. Type <span className="font-bold text-error">reset</span> to confirm.
            </p>
            <input
              type="text"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value.toLowerCase())}
              onKeyDown={(e) => { if (e.key === 'Enter' && resetInput === 'reset') { handleReset(); setShowResetConfirm(false) } }}
              className="w-full bg-surface-container border-2 border-outline-variant rounded-lg text-center text-lg px-4 py-3 outline-none focus:border-error text-on-surface"
              autoFocus
              placeholder="Type reset"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest bg-surface-container text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleReset(); setShowResetConfirm(false) }}
                disabled={resetInput !== 'reset'}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm uppercase tracking-widest bg-error text-on-error hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="px-5 pt-6 max-w-4xl mx-auto">
        {/* Player Welcome Card */}
        {!isAdmin && currentPlayerId && (() => {
          const sorted = [...players].sort((a, b) => b.elo - a.elo)
          const me = sorted.find((p) => p.id === currentPlayerId)
          if (!me) return null
          const rank = sorted.indexOf(me) + 1
          const initials = me.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
          return (
            <div className="mb-6 bg-surface-container-high rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                <span className="text-xl font-black">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-on-surface truncate">{me.tag}</h2>
                <p className="text-on-surface-variant text-sm truncate">{me.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-primary text-2xl font-black leading-tight">{me.elo.toLocaleString()}</p>
                <p className="text-on-surface-variant text-xs font-bold">#{rank}</p>
              </div>
            </div>
          )
        })()}

        {screen === 'leaderboard' && (
          <Leaderboard
            players={players}
            activeGames={activeGames}
            stationConfig={stationConfig}
          />
        )}

        {screen === 'addMatch' && (
          <AddMatchModal
            players={players}
            activeGames={activeGames}
            stationConfig={stationConfig}
            currentPlayerId={currentPlayerId}
            onSubmit={handleMatchSubmit}
            onStartGame={handleStartGame}
            onGameStarted={() => {
              // Game was just created — go to leaderboard so lock screen takes over
              setManagingStationId(null)
              setScreen('leaderboard')
            }}
            onClose={() => {
              if (managingStationId) {
                handleClearGame(managingStationId)
              }
              setManagingStationId(null)
              setScreen('leaderboard')
            }}
          />
        )}

        {screen === 'admin' && isAdmin && (
          <AdminSettings
            players={players}
            matches={matches}
            activeGames={activeGames}
            stationConfig={stationConfig}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onClearGame={handleClearGame}
            onSubmitResult={handleSubmitResult}
            onToggleRapidZone={handleToggleRapidZone}
            onToggleGameVisibility={handleToggleGameVisibility}
            onUndoMatch={handleUndoMatch}
            onReset={() => { setShowResetConfirm(true); setResetInput('') }}
            onLogout={() => { handleAdminLogout(); setScreen('leaderboard') }}
          />
        )}
      </main>

      {/* Match Lock Screen (player view) */}
      {showLockScreen && myActiveGame && (
        <MatchLockScreen
          activeGame={myActiveGame}
          players={players}
          onCancel={() => handleClearGame(myActiveGame.stationId)}
          onSubmit={handleMatchSubmit}
        />
      )}

      {/* Admin Submit Result overlay */}
      {adminSubmitGame && (
        <MatchLockScreen
          activeGame={adminSubmitGame}
          players={players}
          onCancel={() => {
            handleClearGame(adminSubmitGame.stationId)
            setAdminSubmitGame(null)
          }}
          onSubmit={handleMatchSubmit}
          onClose={() => setAdminSubmitGame(null)}
          startAtSubmit
        />
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 bg-[#0e0e0e] border-t border-outline-variant/30">
        <div className="flex justify-around items-center w-full px-6 h-20">
          {/* Leaderboard */}
          <button
            onClick={() => setScreen('leaderboard')}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
              screen === 'leaderboard'
                ? 'text-primary'
                : 'text-white/40 hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[1.5rem] ${screen === 'leaderboard' ? 'filled' : ''}`}>leaderboard</span>
            <span className="font-label text-[0.65rem] font-bold uppercase tracking-wider">Leaderboard</span>
          </button>

          {/* Add Match */}
          <button
            onClick={() => setScreen('addMatch')}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
              screen === 'addMatch'
                ? 'text-primary'
                : 'text-white/40 hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[1.5rem] ${screen === 'addMatch' ? 'filled' : ''}`}>add_circle</span>
            <span className="font-label text-[0.65rem] font-bold uppercase tracking-wider">Add Match</span>
          </button>

          {/* Admin */}
          {isAdmin && (
          <button
            onClick={() => {
              setPinValue('')
              setShowPinInput(true)
            }}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer ${
              screen === 'admin'
                ? 'text-primary'
                : 'text-white/40 hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined text-[1.5rem] ${screen === 'admin' ? 'filled' : ''}`}>settings</span>
            <span className="font-label text-[0.65rem] font-bold uppercase tracking-wider">Admin</span>
          </button>
          )}
        </div>
      </nav>
    </div>
  )
}
