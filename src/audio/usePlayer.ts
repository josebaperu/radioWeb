import { useContext } from 'react'
import { PlayerContext } from './player-context.ts'

export function usePlayer() {
  const api = useContext(PlayerContext)
  if (!api) throw new Error('usePlayer must be used inside PlayerProvider')
  return api
}
