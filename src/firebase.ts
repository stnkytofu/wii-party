import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, type DatabaseReference } from 'firebase/database'
import type { Player, MatchResult, ActiveGame, StationConfig } from './types'

const firebaseConfig = {
  apiKey: "AIzaSyBJUKf2C4SgWAvhQ1l5LX9EFz5t8CV6zao",
  authDomain: "wii-party-ef4fb.firebaseapp.com",
  databaseURL: "https://wii-party-ef4fb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wii-party-ef4fb",
  storageBucket: "wii-party-ef4fb.firebasestorage.app",
  messagingSenderId: "396576669436",
  appId: "1:396576669436:web:53ef80e3783561e332e179",
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// Database references
const playersRef: DatabaseReference = ref(db, 'players')
const matchesRef: DatabaseReference = ref(db, 'matches')
const activeGamesRef: DatabaseReference = ref(db, 'activeGames')
const stationConfigRef: DatabaseReference = ref(db, 'stationConfig')

/** Write players array to Firebase */
export function writePlayers(players: Player[]): void {
  set(playersRef, players)
}

/** Write matches array to Firebase */
export function writeMatches(matches: MatchResult[]): void {
  set(matchesRef, matches)
}

/** Subscribe to real-time player updates */
export function onPlayersChange(callback: (players: Player[]) => void): () => void {
  const unsubscribe = onValue(playersRef, (snapshot) => {
    const raw: Player[] = snapshot.val() ?? []
    // Normalize: ensure new fields have defaults for legacy data
    const players = raw.map((p) => ({ ...p, streak: p.streak ?? 0 }))
    callback(players)
  })
  return unsubscribe
}

/** Subscribe to real-time match updates */
export function onMatchesChange(callback: (matches: MatchResult[]) => void): () => void {
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    callback(snapshot.val() ?? [])
  })
  return unsubscribe
}

/** Write active games array to Firebase */
export function writeActiveGames(games: ActiveGame[]): void {
  set(activeGamesRef, games)
}

/** Subscribe to real-time active game updates */
export function onActiveGamesChange(callback: (games: ActiveGame[]) => void): () => void {
  return onValue(activeGamesRef, (snapshot) => {
    callback(snapshot.val() ?? [])
  })
}

/** Write station config to Firebase */
export function writeStationConfig(config: StationConfig): void {
  set(stationConfigRef, config)
}

/** Subscribe to real-time station config updates */
export function onStationConfigChange(callback: (config: StationConfig) => void): () => void {
  return onValue(stationConfigRef, (snapshot) => {
    callback(snapshot.val() ?? { rapidZoneActive: false, gameVisibility: {} })
  })
}
