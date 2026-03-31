import { useState } from 'react'
import type { Player, MatchResult, Placement } from './types'
import { generateId } from './utils'

type Props = {
  players: Player[]
  onSubmit: (result: MatchResult) => void
  onClose: () => void
}

type Step = 'select' | 'place'

export function AddMatchModal({ players, onSubmit, onClose }: Props) {
  const [step, setStep] = useState<Step>('select')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [placements, setPlacements] = useState<Placement[]>([])

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const goToPlace = () => {
    if (selectedIds.length < 2) return
    setPlacements([])
    setStep('place')
  }

  const assignPosition = (playerId: string, position: number) => {
    // Remove any existing placement for this player
    const filtered = placements.filter((p) => p.playerId !== playerId && p.position !== position)
    const newPlacements = [...filtered, { playerId, position }]
    setPlacements(newPlacements)
  }

  const getPlayerName = (id: string): string =>
    players.find((p) => p.id === id)?.name ?? '???'

  const canSubmit =
    placements.length === selectedIds.length &&
    new Set(placements.map((p) => p.position)).size === selectedIds.length

  const handleSubmit = () => {
    if (!canSubmit) return
    const result: MatchResult = {
      id: generateId(),
      playerIds: selectedIds,
      placements,
      timestamp: Date.now(),
    }
    onSubmit(result)
  }

  const getPositionForPlayer = (playerId: string): number | undefined =>
    placements.find((p) => p.playerId === playerId)?.position

  return (
    <div className="space-y-10 animate-slide-up">
      {/* Step Header */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-[1.75rem] font-bold font-headline tracking-tight">
            {step === 'select' ? 'Select Players' : 'Players & Placements'}
          </h2>
          <span className="text-primary text-xs font-bold uppercase tracking-widest">
            Step {step === 'select' ? '1' : '2'}/3
          </span>
        </div>

        {step === 'select' && (
          <>
            <p className="text-on-surface-variant text-sm mb-4">Tap 2–4 players to include in this match</p>
            <div className="space-y-3">
              {players.map((p) => {
                const isSelected = selectedIds.includes(p.id)
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
                        <p className="font-bold text-lg">{p.name}</p>
                        <p className={`text-xs font-bold uppercase tracking-widest ${
                          isSelected ? 'text-primary' : 'text-white/50'
                        }`}>
                          {isSelected ? 'Selected' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="material-symbols-outlined text-primary filled">check_circle</span>
                    ) : (
                      <span className="px-6 py-2 rounded-full bg-surface-variant text-xs font-bold uppercase tracking-widest group-hover:bg-primary group-hover:text-on-primary transition-all">
                        Add
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={goToPlace}
              disabled={selectedIds.length < 2}
              className="w-full mt-6 py-5 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center gap-2 shadow-[0_20px_40px_rgba(145,247,142,0.15)] transition-all duration-500 hover:scale-[0.98] active:scale-95 disabled:opacity-30 disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-on-primary-container text-2xl">arrow_forward</span>
              <span className="text-on-primary-container font-black text-lg tracking-tighter uppercase">
                Next — Assign Places ({selectedIds.length})
              </span>
            </button>
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
                      {selectedIds.map((_, i) => {
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
                className="flex-1 py-4 bg-surface-container-high rounded-xl text-on-surface-variant font-bold text-sm uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
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
              Points will be applied to the leaderboard immediately
            </p>
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
