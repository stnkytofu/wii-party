export type Player = {
  id: string
  name: string
  elo: number
  sipCount: number
}

export type Placement = {
  playerId: string
  position: number
}

export type MatchResult = {
  id: string
  playerIds: string[]
  placements: Placement[]
  timestamp: number
}

export type Screen = 'leaderboard' | 'addMatch'
