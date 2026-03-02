const MIME_TYPES = {
  m3u8: "application/x-mpegURL",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  ogv: "video/ogg",
  wav: "audio/wav",
  webm: "video/webm",
}

const MEDIA_PREFIXES = ["audio/", "video/"]

const getMimeTypeFromSrc = (src) => {
  if (!src) {
    return ""
  }

  const cleanSource = `${src}`.split("?")[0]
  const extension = cleanSource.split(".").pop()?.toLowerCase()
  return MIME_TYPES[extension] || ""
}

const normalizeTrack = ({
  currentTime = 0,
  duration = 0,
  entryId = null,
  mimeType = "",
  poster = "",
  src,
  title = "",
}) => {
  if (!src) {
    return null
  }

  return {
    currentTime: Math.max(0, Number(currentTime) || 0),
    duration: Math.max(0, Number(duration) || 0),
    entryId: Number.isFinite(Number(entryId)) ? Number(entryId) : null,
    mimeType,
    poster,
    src,
    title,
  }
}

const extractSourceFromMediaElement = (node) => {
  if (!node) {
    return { mimeType: "", src: "" }
  }

  const sourceElement = node.querySelector("source[src]")
  return {
    mimeType: sourceElement?.getAttribute("type") || node.getAttribute("type") || "",
    src: sourceElement?.getAttribute("src") || node.getAttribute("src") || "",
  }
}

const createTrackFromEntry = ({ entry, mimeType, poster = "", src }) => {
  return normalizeTrack({
    entryId: entry.id,
    mimeType: mimeType || getMimeTypeFromSrc(src),
    poster: poster || entry.coverSource || "",
    src,
    title: entry.title || "",
  })
}

export const isPlayableMediaMime = (mimeType = "") => {
  return MEDIA_PREFIXES.some((prefix) => mimeType.toLowerCase().startsWith(prefix))
}

export const isSameTrack = (firstTrack, secondTrack) => {
  if (!firstTrack || !secondTrack) {
    return false
  }

  return firstTrack.src === secondTrack.src && firstTrack.entryId === secondTrack.entryId
}

export const formatMediaTime = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

export const extractPlayableMediaCandidate = (entry) => {
  if (!entry) {
    return { candidate: null, reason: "none" }
  }

  const enclosure = entry.mediaPlayerEnclosure
  if (enclosure?.url && isPlayableMediaMime(enclosure.mime_type || "")) {
    return {
      candidate: createTrackFromEntry({
        entry,
        mimeType: enclosure.mime_type || "",
        poster: entry.coverSource || "",
        src: enclosure.url,
      }),
      reason: "enclosure",
    }
  }

  const content = `${entry.content || ""}`
  if (!content.trim()) {
    return { candidate: null, reason: "none" }
  }

  const doc = new DOMParser().parseFromString(content, "text/html")
  const mediaNode = doc.querySelector("audio, video")

  if (mediaNode) {
    const { mimeType, src } = extractSourceFromMediaElement(mediaNode)
    if (src) {
      return {
        candidate: createTrackFromEntry({
          entry,
          mimeType,
          poster: mediaNode.getAttribute("poster") || entry.coverSource || "",
          src,
        }),
        reason: "native",
      }
    }
  }

  if (doc.querySelector("iframe")) {
    return { candidate: null, reason: "iframe-only" }
  }

  return { candidate: null, reason: "none" }
}
