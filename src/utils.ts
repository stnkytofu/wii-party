import type { Player, MatchResult } from './types'

/** Generate a short random ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/** Create a new player with default stats */
export function createPlayer(name: string, tag: string): Player {
  return {
    id: generateId(),
    name: name.trim(),
    tag: tag.trim(),
    elo: 1000,
    streak: 0,
  }
}

// ── ELO constants ──
const K = 24                  // Standard 
const LAST_PLACE_DELTA = -8   // Last place loses a small amount
const FIRST_PLACE_DELTA = 25  // First place gains this much
const RANDOM_RANGE = 6        // Chaos factor for fun
const MIN_SCORE = 0

function expectedScore(rI: number, rJ: number): number {
  return 1 / (1 + 10 ** ((rJ - rI) / 400))
}

/**
 * Placement-based ELO — smooth scale from small loss to solid gain,
 * with a K-factor nudge based on relative ratings.
 *
 * Points scale linearly from last place (small loss) to 1st (solid gain).
 * A small ELO-aware adjustment (K=24) rewards beating higher-rated opponents
 * and slightly penalizes losing to lower-rated ones.
 * Streak bonus at 3+ consecutive wins, random factor for fun.
 */
export function computeEloDeltas(
  players: Player[],
  matchResult: MatchResult
): Map<string, number> {
  const positionMap = new Map<string, number>()
  for (const p of matchResult.placements) {
    positionMap.set(p.playerId, p.position)
  }

  const playerMap = new Map<string, Player>()
  for (const p of players) {
    playerMap.set(p.id, p)
  }

  // Use distinct positions (handles teams: 2 teams → 2 positions, not N players)
  const distinctPositions = new Set(matchResult.placements.map((p) => p.position)).size
  const numSlots = Math.max(distinctPositions, 2)
  const eloChanges = new Map<string, number>()

  for (const playerId of matchResult.playerIds) {
    const player = playerMap.get(playerId)
    if (!player) continue
    const pos = positionMap.get(playerId)
    if (pos === undefined) continue

    // Linear scale: 1st → FIRST_PLACE_DELTA, last → LAST_PLACE_DELTA
    const placementRatio = numSlots > 1 ? (numSlots - pos) / (numSlots - 1) : 1
    let delta = LAST_PLACE_DELTA + (FIRST_PLACE_DELTA - LAST_PLACE_DELTA) * placementRatio

    // K-factor nudge: compare against opponents (different position = opponent)
    const opponents = matchResult.playerIds.filter((id) => id !== playerId && positionMap.get(id) !== pos)
    const avgOpponentElo = opponents.reduce((sum, id) => sum + (playerMap.get(id)?.elo ?? 1000), 0) / (opponents.length || 1)
    const actual = placementRatio // 1.0 for 1st, 0.0 for last
    const expected = expectedScore(player.elo, avgOpponentElo)
    delta += K * (actual - expected)

    // Streak power (flat bonus at 3+)
    const streakMult = (player.streak ?? 0) >= 3 ? 1.15 : 1
    delta *= streakMult

    // Small random chaos factor
    delta += (Math.random() * 2 - 1) * RANDOM_RANGE

    eloChanges.set(playerId, Math.round(delta))
  }

  return eloChanges
}

export function applyMatchResults(
  players: Player[],
  matchResult: MatchResult,
  precomputedDeltas?: Map<string, number>
): Player[] {
  const deltas = precomputedDeltas ?? computeEloDeltas(players, matchResult)

  const positionMap = new Map<string, number>()
  for (const p of matchResult.placements) {
    positionMap.set(p.playerId, p.position)
  }

  return players.map((player) => {
    const delta = deltas.get(player.id)
    if (delta === undefined) return player

    const playerPos = positionMap.get(player.id)
    const newElo = Math.max(MIN_SCORE, player.elo + delta)
    const newStreak = playerPos === 1 ? (player.streak ?? 0) + 1 : 0

    return { ...player, elo: newElo, streak: newStreak }
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
