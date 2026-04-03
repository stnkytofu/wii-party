export type Player = {
  id: string
  name: string
  tag: string
  elo: number
  avatar: string
  streak: number
}

export type Placement = {
  playerId: string
  position: number
}

export type GameVariant = {
  id: string
  name: string
  emoji: string
  minPlayers?: number
  maxPlayers?: number
  teamSize?: number
}

export type Game = {
  id: string
  name: string
  emoji: string
  minPlayers: number
  maxPlayers: number
  teamSize?: number
  variants?: GameVariant[]
}

export const GAMES: Game[] = [
  { id: 'mario-kart', name: 'Mario Kart', emoji: '🏎️', minPlayers: 2, maxPlayers: 4 },
  {
    id: 'wii-sports',
    name: 'Wii Sports',
    emoji: '🎾',
    minPlayers: 2,
    maxPlayers: 4,
    variants: [
      { id: 'tennis-singles', name: 'Tennis Singles', emoji: '🎾', minPlayers: 2, maxPlayers: 2 },
      { id: 'tennis-doubles', name: 'Tennis Doubles', emoji: '🎾', minPlayers: 4, maxPlayers: 4, teamSize: 2 },
      { id: 'bowling', name: 'Bowling', emoji: '🎳', minPlayers: 2, maxPlayers: 4 },
      { id: 'golf', name: 'Golf', emoji: '⛳', minPlayers: 2, maxPlayers: 4 },
      { id: 'baseball', name: 'Baseball', emoji: '⚾', minPlayers: 2, maxPlayers: 2 },
      { id: 'boxing', name: 'Boxing', emoji: '🥊', minPlayers: 2, maxPlayers: 2 },
    ],
  },
]

/** Get effective config (variant overrides game defaults) */
export function getGameConfig(gameId: string, variantId?: string | null) {
  const game = GAMES.find((g) => g.id === gameId)
  if (!game) return { minPlayers: 2, maxPlayers: 4, teamSize: undefined }
  const variant = variantId ? game.variants?.find((v) => v.id === variantId) : undefined
  return {
    minPlayers: variant?.minPlayers ?? game.minPlayers,
    maxPlayers: variant?.maxPlayers ?? game.maxPlayers,
    teamSize: variant?.teamSize ?? game.teamSize,
  }
}

export type MatchResult = {
  id: string
  gameId: string
  variantId?: string
  playerIds: string[]
  placements: Placement[]
  timestamp: number
  deltas?: Record<string, number> // playerId → ELO change applied
}

export type Screen = 'leaderboard' | 'addMatch' | 'admin'

export type StationId = 'dungeon' | 'the-loft' | 'rapid-zone'

export type Station = {
  id: StationId
  name: string
  emoji: string
}

export const STATIONS: Station[] = [
  { id: 'the-loft', name: 'The Loft', emoji: '🌙' },
  { id: 'dungeon', name: 'Dungeon', emoji: '🏚️' },
  { id: 'rapid-zone', name: 'Rapid Zone', emoji: '⚡' },
]

export type ActiveGame = {
  stationId: StationId
  gameId: string
  variantId?: string | null
  playerIds: string[]
  placements?: Placement[]
  startedAt: number
}

export type StationConfig = {
  rapidZoneActive: boolean
  gameVisibility?: Record<string, string[]> // stationId → enabled gameIds (empty/missing = all visible)
}
