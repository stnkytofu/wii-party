export type Player = {
  id: string
  name: string
  tag: string
  elo: number
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
      { id: 'bowling', name: 'Bowling', emoji: '🎳', minPlayers: 2, maxPlayers: 8, teamSize: 2 },
      { id: 'golf', name: 'Golf', emoji: '⛳', minPlayers: 2, maxPlayers: 8, teamSize: 2 },
      { id: 'baseball', name: 'Baseball', emoji: '⚾', minPlayers: 2, maxPlayers: 8, teamSize: 4 },
      { id: 'boxing', name: 'Boxing', emoji: '🥊', minPlayers: 2, maxPlayers: 2 },
    ],
  },
  {
    id: 'wii-sports-resort',
    name: 'Wii Sports Resort',
    emoji: '🏝️',
    minPlayers: 2,
    maxPlayers: 4,
    variants: [
      { id: 'swordplay', name: 'Swordplay', emoji: '⚔️', minPlayers: 2, maxPlayers: 2 },
      { id: 'wakeboarding', name: 'Wakeboarding', emoji: '🏄', minPlayers: 2, maxPlayers: 4 },
      { id: 'frisbee', name: 'Frisbee', emoji: '🥏', minPlayers: 2, maxPlayers: 4 },
      { id: 'archery', name: 'Archery', emoji: '🏹', minPlayers: 2, maxPlayers: 4 },
      { id: 'basketball-3pt', name: 'Basketball 3-Point Contest', emoji: '🏀', minPlayers: 2, maxPlayers: 4 },
      { id: 'basketball-3on3', name: 'Basketball 3-on-3', emoji: '🏀', minPlayers: 2, maxPlayers: 2 },
      { id: 'table-tennis-match', name: 'Table Tennis Match', emoji: '🏓', minPlayers: 2, maxPlayers: 2 },
      { id: 'table-tennis-return', name: 'Table Tennis Return', emoji: '🏓', minPlayers: 2, maxPlayers: 4 },
      { id: 'golf-resort', name: 'Golf', emoji: '⛳', minPlayers: 2, maxPlayers: 8, teamSize: 2 },
      { id: 'bowling-10pin', name: 'Bowling 10-Pin', emoji: '🎳', minPlayers: 2, maxPlayers: 8, teamSize: 2 },
      { id: 'power-cruising', name: 'Power Cruising', emoji: '🚤', minPlayers: 2, maxPlayers: 4 },
      { id: 'canoeing', name: 'Canoeing VS', emoji: '🛶', minPlayers: 2, maxPlayers: 4 },
      { id: 'cycling', name: 'Cycling VS', emoji: '🚴', minPlayers: 2, maxPlayers: 2 },
      { id: 'air-sports-dogfight', name: 'Dogfight', emoji: '✈️', minPlayers: 2, maxPlayers: 2 },
    ],
  },
  {
    id: 'mario-sonic-olympics',
    name: 'Mario & Sonic at the Olympic Games',
    emoji: '🥇',
    minPlayers: 2,
    maxPlayers: 4,
    variants: [
      { id: '100m', name: '100m', emoji: '🏃', minPlayers: 2, maxPlayers: 4 },
      { id: '400m-hurdles', name: '400m Hurdles', emoji: '🏃', minPlayers: 2, maxPlayers: 4 },
      { id: 'long-jump', name: 'Long Jump', emoji: '🦘', minPlayers: 2, maxPlayers: 4 },
      { id: 'javelin-throw', name: 'Javelin Throw', emoji: '🏹', minPlayers: 2, maxPlayers: 4 },
      { id: 'hammer-throw', name: 'Hammer Throw', emoji: '🔨', minPlayers: 2, maxPlayers: 4 },
      { id: 'swimming-100m', name: '100m Freestyle', emoji: '🏊', minPlayers: 2, maxPlayers: 4 },
      { id: 'archery-olympics', name: 'Archery', emoji: '🏹', minPlayers: 2, maxPlayers: 4 },
      { id: 'table-tennis-olympics', name: 'Table Tennis', emoji: '🏓', minPlayers: 2, maxPlayers: 2 },
      { id: 'fencing', name: 'Fencing', emoji: '🤺', minPlayers: 2, maxPlayers: 2 },
      { id: 'trampoline', name: 'Trampoline', emoji: '🤸', minPlayers: 2, maxPlayers: 4 },
      { id: 'gymnastics', name: 'Gymnastics', emoji: '🤸', minPlayers: 2, maxPlayers: 4 },
      { id: 'skeet', name: 'Skeet', emoji: '🎯', minPlayers: 2, maxPlayers: 4 },
      { id: 'dream-race', name: 'Dream Race', emoji: '✨', minPlayers: 2, maxPlayers: 4 },
    ],
  },
  {
    id: 'sing-it-disney',
    name: 'Sing It Disney',
    emoji: '🎤',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'super-smash-bros',
    name: 'Super Smash Bros',
    emoji: '👊',
    minPlayers: 2,
    maxPlayers: 8,
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

/** Team colour palette – supports up to 8 teams */
export const TEAM_COLORS = [
  { name: 'Red', bg: 'bg-red-500', bgFaint: 'bg-red-500/10', bgMed: 'bg-red-500/20', text: 'text-red-400', ring: 'ring-red-500', ringFaint: 'ring-red-500/30', shadow: 'shadow-red-500/30' },
  { name: 'Blue', bg: 'bg-blue-500', bgFaint: 'bg-blue-500/10', bgMed: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500', ringFaint: 'ring-blue-500/30', shadow: 'shadow-blue-500/30' },
  { name: 'Green', bg: 'bg-emerald-500', bgFaint: 'bg-emerald-500/10', bgMed: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500', ringFaint: 'ring-emerald-500/30', shadow: 'shadow-emerald-500/30' },
  { name: 'Yellow', bg: 'bg-yellow-500', bgFaint: 'bg-yellow-500/10', bgMed: 'bg-yellow-500/20', text: 'text-yellow-400', ring: 'ring-yellow-500', ringFaint: 'ring-yellow-500/30', shadow: 'shadow-yellow-500/30' },
  { name: 'Purple', bg: 'bg-purple-500', bgFaint: 'bg-purple-500/10', bgMed: 'bg-purple-500/20', text: 'text-purple-400', ring: 'ring-purple-500', ringFaint: 'ring-purple-500/30', shadow: 'shadow-purple-500/30' },
  { name: 'Orange', bg: 'bg-orange-500', bgFaint: 'bg-orange-500/10', bgMed: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500', ringFaint: 'ring-orange-500/30', shadow: 'shadow-orange-500/30' },
  { name: 'Pink', bg: 'bg-pink-500', bgFaint: 'bg-pink-500/10', bgMed: 'bg-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500', ringFaint: 'ring-pink-500/30', shadow: 'shadow-pink-500/30' },
  { name: 'Cyan', bg: 'bg-cyan-500', bgFaint: 'bg-cyan-500/10', bgMed: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500', ringFaint: 'ring-cyan-500/30', shadow: 'shadow-cyan-500/30' },
] as const

export function getTeamColor(teamNum: number) {
  return TEAM_COLORS[(teamNum - 1) % TEAM_COLORS.length]!
}
