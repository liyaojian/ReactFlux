import { persistentAtom } from "@nanostores/persistent"

const DEFAULT_PLAYBACK_RATE = 1
const DEFAULT_VOLUME = 1
const MAX_VOLUME = 1
const MAX_PLAYBACK_RATE = 2
const MIN_PLAYBACK_RATE = 0.5

const defaultTrack = null

const defaultState = {
  candidateTrack: defaultTrack,
  currentTime: 0,
  currentTrack: defaultTrack,
  duration: 0,
  errorMessage: "",
  lastSnapshotAt: 0,
  muted: false,
  playbackRate: DEFAULT_PLAYBACK_RATE,
  status: "idle",
  volume: DEFAULT_VOLUME,
}

const clampNumber = (value, minimum, maximum, fallback) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return fallback
  }

  return Math.min(maximum, Math.max(minimum, numericValue))
}

const normalizeTrack = (track) => {
  if (!track || typeof track !== "object") {
    return null
  }

  const src = `${track.src || ""}`.trim()
  if (!src) {
    return null
  }

  return {
    currentTime: Math.max(0, Number(track.currentTime) || 0),
    duration: Math.max(0, Number(track.duration) || 0),
    entryId: Number.isFinite(Number(track.entryId)) ? Number(track.entryId) : null,
    mimeType: `${track.mimeType || ""}`,
    poster: `${track.poster || ""}`,
    src,
    title: `${track.title || ""}`,
  }
}

const normalizeState = (value = {}) => {
  const mergedState = { ...defaultState, ...value }

  return {
    ...mergedState,
    candidateTrack: normalizeTrack(mergedState.candidateTrack),
    currentTime: Math.max(0, Number(mergedState.currentTime) || 0),
    currentTrack: normalizeTrack(mergedState.currentTrack),
    duration: Math.max(0, Number(mergedState.duration) || 0),
    errorMessage: `${mergedState.errorMessage || ""}`,
    lastSnapshotAt: Math.max(0, Number(mergedState.lastSnapshotAt) || 0),
    muted: Boolean(mergedState.muted),
    playbackRate: clampNumber(
      mergedState.playbackRate,
      MIN_PLAYBACK_RATE,
      MAX_PLAYBACK_RATE,
      DEFAULT_PLAYBACK_RATE,
    ),
    status: `${mergedState.status || "idle"}`,
    volume: clampNumber(mergedState.volume, 0, MAX_VOLUME, DEFAULT_VOLUME),
  }
}

export const mediaPlayerState = persistentAtom("media-player-state", defaultState, {
  decode: (storedValue) => {
    try {
      return normalizeState(JSON.parse(storedValue))
    } catch {
      return defaultState
    }
  },
  encode: (value) => JSON.stringify(normalizeState(value)),
})

export const setCurrentTrack = (track) => {
  mediaPlayerState.set({ ...mediaPlayerState.get(), currentTrack: normalizeTrack(track) })
}

export const setCandidateTrack = (track) => {
  mediaPlayerState.set({ ...mediaPlayerState.get(), candidateTrack: normalizeTrack(track) })
}

export const updatePlaybackState = (changes = {}) => {
  mediaPlayerState.set(normalizeState({ ...mediaPlayerState.get(), ...changes }))
}

export const clearTrack = () => {
  const { muted, playbackRate, volume } = mediaPlayerState.get()
  mediaPlayerState.set(
    normalizeState({
      ...defaultState,
      muted,
      playbackRate,
      volume,
    }),
  )
}

export const hydrateFromSnapshot = (snapshot = {}) => {
  mediaPlayerState.set(normalizeState({ ...mediaPlayerState.get(), ...snapshot }))
}
