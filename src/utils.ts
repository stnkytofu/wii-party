import type { Player, MatchResult } from './types'

/** Generate a short random ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/** Create a new player with default stats */
export function createPlayer(name: string): Player {
  return {
    id: generateId(),
    name: name.trim(),
    elo: 1000,
    sipCount: 0,
  }
}

/**
 * Apply Elo changes from a match result.
 *
 * 4-player: 1st +30, 2nd +10, 3rd 0, 4th -10
 * 3-player: 1st +25, 2nd +5, 3rd -5
 * 2-player: Winner +20, Loser -10
 */
export function applyMatchResults(
  players: Player[],
  matchResult: MatchResult
): Player[] {
  const playerCount = matchResult.playerIds.length

  const eloMap: Record<number, Record<number, number>> = {
    4: { 1: 30, 2: 10, 3: 0, 4: -10 },
    3: { 1: 25, 2: 5, 3: -5 },
    2: { 1: 20, 2: -10 },
  }

  const deltas = eloMap[playerCount]
  if (!deltas) return players

  return players.map((player) => {
    const placement = matchResult.placements.find(
      (p) => p.playerId === player.id
    )
    if (!placement) return player

    const delta = deltas[placement.position] ?? 0
    return { ...player, elo: player.elo + delta }
  })
}

/** Load state from localStorage */
export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    // corrupted data, ignore
  }
  return fallback
}

/** Save state to localStorage */
export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}
