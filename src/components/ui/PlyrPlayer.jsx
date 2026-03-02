import { Button } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import { saveEnclosureProgression } from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState } from "@/store/contentState"
import "plyr/dist/plyr.css"
import "./PlyrPlayer.css"

const PlyrPromise = import("plyr")

const MEDIA_TYPES = {
  HLS: "hls",
  VIDEO: "video",
  AUDIO: "audio",
}

const MIME_TYPES = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  m3u8: "application/x-mpegURL",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
}

const DEFAULT_CONTROLS = [
  "play-large",
  "rewind",
  "play",
  "fast-forward",
  "progress",
  "current-time",
  "mute",
  "volume",
  "captions",
  "settings",
  "pip",
  "airplay",
  "fullscreen",
]

const getMimeType = (src, sourceType) => {
  if (sourceType) {
    return sourceType
  }

  if (!src) {
    return ""
  }

  const extension = src.split(".").pop()?.toLowerCase()
  return MIME_TYPES[extension] || ""
}

const getMediaType = (src, sourceType, elementType) => {
  const mimeType = sourceType || getMimeType(src, sourceType)

  if (mimeType.includes("mpegURL") || mimeType.includes("mpegurl")) {
    return MEDIA_TYPES.HLS
  }
  if (mimeType.startsWith("video/")) {
    return MEDIA_TYPES.VIDEO
  }
  if (mimeType.startsWith("audio/")) {
    return MEDIA_TYPES.AUDIO
  }

  return elementType === "audio" ? MEDIA_TYPES.AUDIO : MEDIA_TYPES.VIDEO
}

const initHls = async (mediaRef, src, onError) => {
  const { default: Hls } = await import("hls.js")

  if (!Hls.isSupported()) {
    if (mediaRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      mediaRef.current.src = src
      return true
    }
    throw new Error("HLS is not supported in this browser.")
  }

  const hls = new Hls()
  hls.loadSource(src)
  hls.attachMedia(mediaRef.current)
  hls.on(Hls.Events.ERROR, (event, data) => {
    onError({ type: "hls", event, data })
  })

  return hls
}

const PlyrPlayer = ({
  src,
  sourceType,
  elementType = "video",
  plyrOptions = {},
  poster = "",
  style = {},
  enclosure = null,
  entryId = null,
  mediaTitle = "",
  onBackgroundPlay = () => {},
  onPlaybackSnapshot = () => {},
  onPlayerInit = () => {},
  onError = () => {},
  showBackgroundAction = false,
}) => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const mediaRef = useRef(null)
  const playerRef = useRef(null)
  const hlsRef = useRef(null)
  const lastSavedTimeRef = useRef(0)

  const getPlaybackSnapshot = () => {
    if (!playerRef.current) {
      return null
    }

    const currentTime = Math.max(0, Number(playerRef.current.currentTime) || 0)
    const duration = Math.max(0, Number(playerRef.current.duration) || 0)
    const snapshot = {
      currentTime,
      duration,
      entryId: Number.isFinite(Number(entryId)) ? Number(entryId) : null,
      mimeType: getMimeType(src, sourceType),
      poster,
      src,
      title: mediaTitle || activeContent?.title || "",
    }

    return snapshot
  }

  useEffect(() => {
    if (!src || !activeContent) {
      return
    }

    const initPlayer = async () => {
      try {
        const mediaType = getMediaType(src, sourceType, elementType)

        const { default: Plyr } = await PlyrPromise

        playerRef.current = new Plyr(mediaRef.current, {
          controls: DEFAULT_CONTROLS,
          loadSprite: true,
          ...plyrOptions,
        })

        if (mediaType === MEDIA_TYPES.HLS) {
          hlsRef.current = await initHls(mediaRef, src, onError)
        } else {
          mediaRef.current.src = src
        }

        const emitPlaybackSnapshot = () => {
          const snapshot = getPlaybackSnapshot()
          if (snapshot) {
            onPlaybackSnapshot(snapshot)
          }
        }

        playerRef.current.on("loadeddata", emitPlaybackSnapshot)
        playerRef.current.on("timeupdate", emitPlaybackSnapshot)
        playerRef.current.on("pause", emitPlaybackSnapshot)
        playerRef.current.on("ended", emitPlaybackSnapshot)

        if (enclosure) {
          playerRef.current.on("loadeddata", () => {
            playerRef.current.currentTime = enclosure.media_progression
            lastSavedTimeRef.current = enclosure.media_progression
          })

          const updateProgression = () => {
            const { currentTime } = playerRef.current
            saveEnclosureProgression(enclosure.id, Math.floor(currentTime))
            lastSavedTimeRef.current = currentTime
          }

          playerRef.current.on("timeupdate", () => {
            const { currentTime } = playerRef.current
            if (currentTime - lastSavedTimeRef.current >= 10) {
              updateProgression()
            }
          })

          playerRef.current.on("pause", updateProgression)
          playerRef.current.on("ended", updateProgression)
        }

        onPlayerInit(playerRef.current)
      } catch (error) {
        onError({ type: "init", error })
      }
    }

    initPlayer()

    return () => {
      playerRef.current?.destroy()
      hlsRef.current?.destroy()
      playerRef.current = null
      hlsRef.current = null
    }
  }, [src])

  const renderMedia = () => {
    const mediaProps = {
      ref: mediaRef,
      className: "plyr-react plyr",
      poster: poster,
    }

    const sourceProps = {
      src,
      type: getMimeType(src, sourceType),
    }

    return elementType === "audio" ? (
      <audio {...mediaProps}>
        <source {...sourceProps} />
      </audio>
    ) : (
      <video {...mediaProps}>
        <source {...sourceProps} />
      </video>
    )
  }

  return (
    <div style={{ ...style, margin: "0 auto" }}>
      {renderMedia()}
      {showBackgroundAction && (
        <div className="plyr-background-action">
          <Button
            size="mini"
            type="outline"
            onClick={() => {
              const snapshot = getPlaybackSnapshot()
              if (!snapshot) {
                return
              }

              onBackgroundPlay(snapshot)
              playerRef.current?.pause()
            }}
          >
            {polyglot?.t("background_audio_start") || "Background play"}
          </Button>
        </div>
      )}
    </div>
  )
}

export default PlyrPlayer
