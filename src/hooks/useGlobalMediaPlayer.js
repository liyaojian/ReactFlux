import { useStore } from "@nanostores/react"
import { useCallback, useEffect, useRef } from "react"

import {
  clearTrack,
  hydrateFromSnapshot,
  mediaPlayerState,
  setCurrentTrack,
  updatePlaybackState,
} from "@/store/mediaPlayerState"

const SWITCH_TRACK_EVENT = "reactflux:background-audio-switch"
const DEFAULT_SEEK_OFFSET = 10
const SNAPSHOT_INTERVAL_SECONDS = 5

const clearMediaSessionData = () => {
  if (!("mediaSession" in navigator)) {
    return
  }

  const { mediaSession } = navigator
  mediaSession.metadata = null
  mediaSession.playbackState = "none"
}

export const requestGlobalTrackSwitch = (track, options = {}) => {
  if (!track?.src || globalThis.window === undefined) {
    return false
  }

  globalThis.dispatchEvent(
    new CustomEvent(SWITCH_TRACK_EVENT, {
      detail: { options, track },
    }),
  )

  return true
}

const useGlobalMediaPlayer = () => {
  const playerState = useStore(mediaPlayerState)

  const mediaRef = useRef(null)
  const playerStateRef = useRef(playerState)
  const lastSyncedSecondRef = useRef(0)

  useEffect(() => {
    playerStateRef.current = playerState
  }, [playerState])

  const play = useCallback(async () => {
    const media = mediaRef.current
    if (!media || !playerStateRef.current.currentTrack?.src) {
      return false
    }

    try {
      await media.play()
      updatePlaybackState({ errorMessage: "", status: "playing" })
      return true
    } catch {
      updatePlaybackState({ status: "paused" })
      return false
    }
  }, [])

  const pause = useCallback(() => {
    const media = mediaRef.current
    if (!media) {
      return
    }

    media.pause()
    updatePlaybackState({
      currentTime: Math.max(0, Number(media.currentTime) || 0),
      status: "paused",
    })
  }, [])

  const seek = useCallback((nextTime) => {
    const media = mediaRef.current
    if (!media) {
      return
    }

    const normalizedTime = Math.max(0, Number(nextTime) || 0)
    media.currentTime = normalizedTime
    updatePlaybackState({ currentTime: normalizedTime })
  }, [])

  const setVolume = useCallback((nextVolume) => {
    const media = mediaRef.current
    const normalizedVolume = Math.min(1, Math.max(0, Number(nextVolume) || 0))

    if (media) {
      media.volume = normalizedVolume
      if (normalizedVolume > 0 && media.muted) {
        media.muted = false
      }
    }

    updatePlaybackState({
      muted: normalizedVolume === 0 ? true : playerStateRef.current.muted,
      volume: normalizedVolume,
    })
  }, [])

  const setMuted = useCallback((nextMuted) => {
    const media = mediaRef.current
    const muted = Boolean(nextMuted)

    if (media) {
      media.muted = muted
    }

    updatePlaybackState({ muted })
  }, [])

  const setRate = useCallback((nextRate) => {
    const media = mediaRef.current
    const normalizedRate = Math.min(2, Math.max(0.5, Number(nextRate) || 1))

    if (media) {
      media.playbackRate = normalizedRate
    }

    updatePlaybackState({ playbackRate: normalizedRate })
  }, [])

  const switchToTrack = useCallback(
    async (track, options = {}) => {
      const media = mediaRef.current
      if (!media || !track?.src) {
        return false
      }

      const autoplay = options.autoplay !== false
      const startTime = Math.max(0, Number(options.startTime ?? track.currentTime) || 0)
      const nextTrack = {
        ...track,
        currentTime: startTime,
        duration: Math.max(0, Number(track.duration) || 0),
      }

      setCurrentTrack(nextTrack)
      updatePlaybackState({
        currentTime: startTime,
        duration: nextTrack.duration,
        errorMessage: "",
        status: "loading",
      })

      media.pause()
      media.src = nextTrack.src
      media.load()
      lastSyncedSecondRef.current = startTime

      const finalizePlayback = async () => {
        if (!autoplay) {
          updatePlaybackState({ status: "paused" })
          return
        }

        await play()
      }

      const handleLoadError = () => {
        updatePlaybackState({
          errorMessage: "Failed to load media source.",
          status: "error",
        })
      }

      const handleLoadedMetadata = () => {
        media.removeEventListener("error", handleLoadError)

        if (startTime > 0) {
          try {
            media.currentTime = startTime
          } catch {
            // Ignore invalid seek attempts from unavailable metadata ranges.
          }
        }

        const duration = Number.isFinite(media.duration)
          ? Math.max(0, media.duration)
          : nextTrack.duration
        updatePlaybackState({
          currentTime: Math.max(0, Number(media.currentTime) || startTime),
          duration,
        })

        void finalizePlayback()
      }

      media.addEventListener("error", handleLoadError, { once: true })
      media.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })

      return true
    },
    [play],
  )

  const close = useCallback(() => {
    const media = mediaRef.current
    if (media) {
      media.pause()
      media.removeAttribute("src")
      media.load()
    }

    clearTrack()
    clearMediaSessionData()
  }, [])

  useEffect(() => {
    const media = document.createElement("video")
    media.preload = "metadata"
    media.playsInline = true

    Object.assign(media.style, {
      height: "1px",
      left: "-10000px",
      opacity: "0",
      pointerEvents: "none",
      position: "fixed",
      top: "-10000px",
      width: "1px",
    })

    media.setAttribute("aria-hidden", "true")
    mediaRef.current = media
    document.body.append(media)

    const snapshot = mediaPlayerState.get()
    media.volume = snapshot.volume
    media.muted = snapshot.muted
    media.playbackRate = snapshot.playbackRate

    const handleTimeUpdate = () => {
      const currentTime = Math.max(0, Number(media.currentTime) || 0)
      const duration = Number.isFinite(media.duration)
        ? Math.max(0, Number(media.duration) || 0)
        : playerStateRef.current.duration
      const hasSecondChanged = Math.floor(currentTime) !== Math.floor(lastSyncedSecondRef.current)

      if (!hasSecondChanged && Math.abs(duration - playerStateRef.current.duration) < 0.5) {
        return
      }

      const shouldWriteSnapshot =
        Math.floor(currentTime) % SNAPSHOT_INTERVAL_SECONDS === 0 &&
        Math.floor(currentTime) !== Math.floor(lastSyncedSecondRef.current)

      updatePlaybackState({
        currentTime,
        duration,
        lastSnapshotAt: shouldWriteSnapshot ? Date.now() : playerStateRef.current.lastSnapshotAt,
      })
      lastSyncedSecondRef.current = currentTime
    }

    const handlePlay = () => {
      updatePlaybackState({ errorMessage: "", status: "playing" })
    }

    const handlePause = () => {
      if (playerStateRef.current.status !== "ended") {
        updatePlaybackState({
          currentTime: Math.max(0, Number(media.currentTime) || 0),
          status: "paused",
        })
      }
    }

    const handleEnded = () => {
      updatePlaybackState({
        currentTime: Math.max(0, Number(media.duration) || 0),
        status: "ended",
      })
    }

    const handleError = () => {
      updatePlaybackState({
        errorMessage: "Failed to play media.",
        status: "error",
      })
    }

    const handleVolumeChange = () => {
      updatePlaybackState({
        muted: media.muted,
        volume: media.volume,
      })
    }

    const handleRateChange = () => {
      updatePlaybackState({ playbackRate: media.playbackRate })
    }

    media.addEventListener("timeupdate", handleTimeUpdate)
    media.addEventListener("play", handlePlay)
    media.addEventListener("pause", handlePause)
    media.addEventListener("ended", handleEnded)
    media.addEventListener("error", handleError)
    media.addEventListener("volumechange", handleVolumeChange)
    media.addEventListener("ratechange", handleRateChange)

    if (snapshot.currentTrack?.src) {
      hydrateFromSnapshot({
        errorMessage: "",
        status: "paused",
      })

      void switchToTrack(snapshot.currentTrack, {
        autoplay: false,
        startTime: snapshot.currentTime,
      })
    }

    const handleSwitchTrackRequest = (event) => {
      const { detail } = event
      const options = detail?.options || {}
      const track = detail?.track

      if (track?.src) {
        void switchToTrack(track, options)
      }
    }

    globalThis.addEventListener(SWITCH_TRACK_EVENT, handleSwitchTrackRequest)

    return () => {
      globalThis.removeEventListener(SWITCH_TRACK_EVENT, handleSwitchTrackRequest)

      media.pause()
      media.removeEventListener("timeupdate", handleTimeUpdate)
      media.removeEventListener("play", handlePlay)
      media.removeEventListener("pause", handlePause)
      media.removeEventListener("ended", handleEnded)
      media.removeEventListener("error", handleError)
      media.removeEventListener("volumechange", handleVolumeChange)
      media.removeEventListener("ratechange", handleRateChange)
      media.removeAttribute("src")
      media.load()
      media.remove()
      mediaRef.current = null
    }
  }, [switchToTrack])

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return
    }

    const { mediaSession } = navigator
    mediaSession.setActionHandler("play", () => {
      void play()
    })
    mediaSession.setActionHandler("pause", pause)
    mediaSession.setActionHandler("seekbackward", (details) => {
      seek(playerStateRef.current.currentTime - (details.seekOffset || DEFAULT_SEEK_OFFSET))
    })
    mediaSession.setActionHandler("seekforward", (details) => {
      seek(playerStateRef.current.currentTime + (details.seekOffset || DEFAULT_SEEK_OFFSET))
    })
    mediaSession.setActionHandler("seekto", (details) => {
      if (typeof details.seekTime === "number") {
        seek(details.seekTime)
      }
    })

    return () => {
      mediaSession.setActionHandler("play", null)
      mediaSession.setActionHandler("pause", null)
      mediaSession.setActionHandler("seekbackward", null)
      mediaSession.setActionHandler("seekforward", null)
      mediaSession.setActionHandler("seekto", null)
    }
  }, [pause, play, seek])

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return
    }

    const { mediaSession } = navigator

    if (!playerState.currentTrack?.src) {
      clearMediaSessionData()
      return
    }

    if ("MediaMetadata" in globalThis) {
      const artwork = playerState.currentTrack.poster
        ? [{ src: playerState.currentTrack.poster }]
        : undefined

      mediaSession.metadata = new MediaMetadata({
        album: "ReactFlux",
        artist: "ReactFlux",
        artwork,
        title: playerState.currentTrack.title || "ReactFlux",
      })
    }

    mediaSession.playbackState = playerState.status === "playing" ? "playing" : "paused"

    if (
      typeof mediaSession.setPositionState === "function" &&
      Number.isFinite(playerState.duration) &&
      playerState.duration > 0
    ) {
      try {
        mediaSession.setPositionState({
          duration: playerState.duration,
          playbackRate: playerState.playbackRate,
          position: Math.min(playerState.currentTime, playerState.duration),
        })
      } catch {
        // Ignore unsupported position state in certain browser versions.
      }
    }
  }, [
    playerState.currentTime,
    playerState.currentTrack,
    playerState.duration,
    playerState.playbackRate,
    playerState.status,
  ])

  return {
    close,
    pause,
    play,
    seek,
    setMuted,
    setRate,
    setVolume,
    state: playerState,
    switchToTrack,
  }
}

export default useGlobalMediaPlayer
