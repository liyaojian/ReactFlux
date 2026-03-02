import { Button, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import useGlobalMediaPlayer from "@/hooks/useGlobalMediaPlayer"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { formatMediaTime, isSameTrack } from "@/utils/media"

import "./GlobalAudioBar.css"

const PLAYBACK_RATES = [1, 1.25, 1.5, 2]

const GlobalAudioBar = () => {
  const { isBelowMedium } = useScreenWidth()
  const { polyglot } = useStore(polyglotState)
  const { close, pause, play, seek, setMuted, setRate, setVolume, state, switchToTrack } =
    useGlobalMediaPlayer()

  const {
    candidateTrack,
    currentTime,
    currentTrack,
    duration,
    errorMessage,
    muted,
    playbackRate,
    status,
    volume,
  } = state

  if (!polyglot) {
    return null
  }

  if (!currentTrack && !candidateTrack) {
    return null
  }

  const hasCurrentTrack = Boolean(currentTrack?.src)
  const effectiveTrack = currentTrack || candidateTrack
  const effectiveDuration = duration > 0 ? duration : effectiveTrack?.duration || 0
  const hasSeekRange = hasCurrentTrack && effectiveDuration > 0
  const canSwitchToCandidate =
    Boolean(candidateTrack?.src) && (!currentTrack || !isSameTrack(currentTrack, candidateTrack))

  const handleSwitchTrack = () => {
    const nextTrack = candidateTrack || currentTrack
    if (!nextTrack?.src) {
      return
    }

    void switchToTrack(nextTrack, {
      autoplay: true,
      startTime: nextTrack.currentTime,
    })
  }

  return (
    <section className={`global-audio-bar ${isBelowMedium ? "mobile" : "desktop"}`}>
      <div className="global-audio-bar__header">
        <Typography.Text ellipsis className="global-audio-bar__title">
          {effectiveTrack?.title || polyglot.t("background_audio_unknown_title")}
        </Typography.Text>
        <Button size="mini" type="secondary" onClick={close}>
          {polyglot.t("background_audio_close")}
        </Button>
      </div>

      {canSwitchToCandidate && (
        <Button
          className="global-audio-bar__switch"
          size="mini"
          type="outline"
          onClick={handleSwitchTrack}
        >
          {polyglot.t("background_audio_switch_to_current")}
        </Button>
      )}

      <div className="global-audio-bar__playback">
        <Button
          disabled={!hasCurrentTrack}
          size="mini"
          type="primary"
          onClick={() => {
            if (status === "playing") {
              pause()
              return
            }

            void play()
          }}
        >
          {status === "playing"
            ? polyglot.t("background_audio_pause")
            : polyglot.t("background_audio_play")}
        </Button>

        <span className="global-audio-bar__time">
          {formatMediaTime(currentTime)} / {formatMediaTime(effectiveDuration)}
        </span>
      </div>

      <input
        className="global-audio-bar__range"
        disabled={!hasSeekRange}
        max={effectiveDuration || 0}
        min={0}
        step={1}
        type="range"
        value={Math.min(currentTime, effectiveDuration || currentTime)}
        onChange={(event) => seek(Number(event.target.value) || 0)}
      />

      <div className="global-audio-bar__footer">
        <label className="global-audio-bar__volume-label" htmlFor="global-audio-volume">
          {polyglot.t("background_audio_volume")}
        </label>
        <input
          className="global-audio-bar__volume"
          id="global-audio-volume"
          max={1}
          min={0}
          step={0.05}
          type="range"
          value={muted ? 0 : volume}
          onChange={(event) => {
            const nextVolume = Number(event.target.value) || 0
            setVolume(nextVolume)
            if (nextVolume > 0 && muted) {
              setMuted(false)
            }
          }}
        />

        <Button size="mini" type="secondary" onClick={() => setMuted(!muted)}>
          {muted ? polyglot.t("background_audio_unmute") : polyglot.t("background_audio_mute")}
        </Button>

        <label className="global-audio-bar__rate-label" htmlFor="global-audio-rate">
          {polyglot.t("background_audio_speed")}
        </label>
        <select
          className="global-audio-bar__rate"
          id="global-audio-rate"
          value={playbackRate}
          onChange={(event) => setRate(Number(event.target.value))}
        >
          {PLAYBACK_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <Typography.Text className="global-audio-bar__error" type="danger">
          {errorMessage || polyglot.t("background_audio_error")}
        </Typography.Text>
      )}
    </section>
  )
}

export default GlobalAudioBar
