import { useState, useEffect, useCallback, useRef } from 'react'
import type { Player, MatchResult, Screen } from './types'
import { createPlayer, applyMatchResults } from './utils'
import { Leaderboard } from './Leaderboard'
import { AddMatchModal } from './AddMatchModal'
import { writePlayers, writeMatches, onPlayersChange, onMatchesChange } from './firebase'

export default function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [_matches, setMatches] = useState<MatchResult[]>([])
  const [screen, setScreen] = useState<Screen>('leaderboard')

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
    return () => { unsubPlayers(); unsubMatches() }
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

  const handleAddPlayer = useCallback((name: string) => {
    updatePlayers((prev) => [...prev, createPlayer(name)])
  }, [updatePlayers])

  const handleRemovePlayer = useCallback((id: string) => {
    updatePlayers((prev) => prev.filter((p) => p.id !== id))
  }, [updatePlayers])

  const handleTapSip = useCallback((id: string) => {
    updatePlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, sipCount: p.sipCount + 1 } : p))
    )
  }, [updatePlayers])

  const handleMatchSubmit = useCallback(
    (result: MatchResult) => {
      updatePlayers((prev) => applyMatchResults(prev, result))
      updateMatches((prev) => [...prev, result])
      setScreen('leaderboard')
    },
    [updatePlayers, updateMatches]
  )

  const handleReset = useCallback(() => {
    isLocalUpdate.current = true
    writePlayers([])
    isLocalUpdate.current = true
    writeMatches([])
    setPlayers([])
    setMatches([])
  }, [])

  return (
    <div className="min-h-screen pb-28">
      {/* Top App Bar — sticky, not fixed, so it takes up flow space */}
      <header className="sticky top-0 w-full z-50 bg-[#0e0e0e] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">sports_esports</span>
            <h1 className="font-headline text-lg font-bold tracking-tight text-primary">Tournament Tracker</h1>
          </div>
          <button
            onClick={handleReset}
            className="text-white/70 font-bold uppercase tracking-widest text-[0.65rem] hover:scale-95 transition-transform duration-500 active:scale-90"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 max-w-4xl mx-auto">
        {screen === 'leaderboard' && (
          <Leaderboard
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onTapSip={handleTapSip}
            onStartMatch={() => setScreen('addMatch')}
          />
        )}

        {screen === 'addMatch' && (
          <AddMatchModal
            players={players}
            onSubmit={handleMatchSubmit}
            onClose={() => setScreen('leaderboard')}
          />
        )}
      </main>

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
        </div>
      </nav>
    </div>
  )
}
