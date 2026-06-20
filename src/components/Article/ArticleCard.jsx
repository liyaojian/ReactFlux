import { Divider, Dropdown, Menu } from "@arco-design/web-react/es"
import {
  IconClockCircle,
  IconLaunch,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
  IconToBottom,
  IconToTop,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { generateReadingTime, generateRelativeTime } from "@/utils/date"
import "./ArticleCard.css"

const ArticleCard = ({ entry, handleEntryClick, children, scrollRoot }) => {
  const {
    enableContextMenu,
    markReadOnScroll,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
  } = useStore(settingsState)
  const { activeContent, infoFrom } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const { hasIntegrations } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const isSelected = activeContent?.id === entry.id
  const isUnread = entry.status === "unread"
  const isStarred = entry.starred
  const showFeedTitle = infoFrom !== "feed"
  const showAuthor = Boolean(entry.author)
  const showSourceMeta = showFeedTitle || showAuthor
  const sourceTooltip = [showFeedTitle ? entry.feed.title : "", entry.author || ""]
    .filter(Boolean)
    .join(" · ")
  const currentEntryIndex = filteredEntries.findIndex((item) => item.id === entry.id)
  const unreadEntriesAbove =
    currentEntryIndex > 0
      ? filteredEntries.slice(0, currentEntryIndex).filter((item) => item.status === "unread")
      : []
  const unreadEntriesBelow =
    currentEntryIndex >= 0
      ? filteredEntries.slice(currentEntryIndex + 1).filter((item) => item.status === "unread")
      : []

  const {
    handleMarkEntriesAsRead,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const wasVisible = useRef(false)
  const cardRef = useRef(null)
  const handleToggleStatusRef = useRef(handleToggleStatus)

  useEffect(() => {
    handleToggleStatusRef.current = handleToggleStatus
  }, [handleToggleStatus])

  useEffect(() => {
    if (!isUnread || !markReadOnScroll || infoFrom === "history") {
      return
    }

    const card = cardRef.current
    if (!scrollRoot || !card) {
      return
    }

    wasVisible.current = false

    const checkVisibility = () => {
      const rootRect = scrollRoot.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const isVisible = cardRect.bottom > rootRect.top && cardRect.top < rootRect.bottom

      if (isVisible) {
        wasVisible.current = true
        return
      }

      if (wasVisible.current && cardRect.bottom <= rootRect.top) {
        handleToggleStatusRef.current(entry)
        scrollRoot.removeEventListener("scroll", checkVisibility)
      }
    }

    scrollRoot.addEventListener("scroll", checkVisibility, { passive: true })
    checkVisibility()

    return () => {
      scrollRoot.removeEventListener("scroll", checkVisibility)
    }
  }, [entry, markReadOnScroll, infoFrom, isUnread, scrollRoot])

  return (
    <Dropdown
      disabled={!enableContextMenu}
      position="bl"
      trigger="contextMenu"
      droplist={
        <Menu>
          <Menu.Item key="open-in-browser" onClick={() => handleOpenLinkExternally(entry)}>
            <div className="settings-menu-item">
              <span>{polyglot.t("article_card.open_link_externally_tooltip")}</span>
              <IconLaunch />
            </div>
          </Menu.Item>

          <Divider style={{ margin: "4px 0" }} />

          <Menu.Item key="toggle-status" onClick={() => handleToggleStatus(entry)}>
            <div className="settings-menu-item">
              <span>
                {isUnread
                  ? polyglot.t("article_card.mark_as_read_tooltip")
                  : polyglot.t("article_card.mark_as_unread_tooltip")}
              </span>
              {isUnread ? <IconMinusCircle /> : <IconRecord />}
            </div>
          </Menu.Item>

          <Menu.Item
            key="mark-above-as-read"
            disabled={unreadEntriesAbove.length === 0}
            onClick={() => handleMarkEntriesAsRead(unreadEntriesAbove)}
          >
            <div className="settings-menu-item">
              <span>{polyglot.t("article_card.mark_above_as_read_tooltip")}</span>
              <IconToTop />
            </div>
          </Menu.Item>

          <Menu.Item
            key="mark-below-as-read"
            disabled={unreadEntriesBelow.length === 0}
            onClick={() => handleMarkEntriesAsRead(unreadEntriesBelow)}
          >
            <div className="settings-menu-item">
              <span>{polyglot.t("article_card.mark_below_as_read_tooltip")}</span>
              <IconToBottom />
            </div>
          </Menu.Item>

          <Menu.Item key="toggle-starred" onClick={() => handleToggleStarred(entry)}>
            <div className="settings-menu-item">
              <span>
                {isStarred
                  ? polyglot.t("article_card.unstar_tooltip")
                  : polyglot.t("article_card.star_tooltip")}
              </span>
              {isStarred ? <IconStarFill style={{ color: "#ffcd00" }} /> : <IconStar />}
            </div>
          </Menu.Item>

          {hasIntegrations && (
            <Menu.Item
              key="save-to-third-party-services"
              onClick={() => handleSaveToThirdPartyServices(entry)}
            >
              <div className="settings-menu-item">
                <span>{polyglot.t("article_card.save_to_third_party_services_tooltip")}</span>
                <IconSave />
              </div>
            </Menu.Item>
          )}
        </Menu>
      }
    >
      <div
        ref={cardRef}
        className={isSelected ? "card-wrapper selected" : "card-wrapper"}
        data-entry-id={entry.id}
        onClick={() => handleEntryClick(entry)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleEntryClick(entry)
          }
        }}
      >
        <div
          className="card-content"
          style={{
            opacity: isUnread ? 1 : 0.5,
          }}
        >
          <div className="card-header">
            <div className="card-meta">
              {showSourceMeta && (
                <div className="card-source">
                  {showFeedTitle && showFeedIcon && (
                    <FeedIcon className="feed-icon-mini" feed={entry.feed} />
                  )}
                  <div className="card-source-content" title={sourceTooltip || undefined}>
                    {showFeedTitle && <span className="card-source-title">{entry.feed.title}</span>}
                    {showFeedTitle && showAuthor && <span className="card-meta-separator">·</span>}
                    {showAuthor && (
                      <span className="card-author" title={entry.author}>
                        {entry.author}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="card-time-wrapper">
                <span className="card-star">
                  <IconStarFill
                    className="icon-starred"
                    style={{ opacity: entry.starred ? 1 : 0 }}
                  />
                </span>
                <span className="card-time">
                  {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
                </span>
                {showEstimatedReadingTime && (
                  <>
                    <span className="card-meta-separator">·</span>
                    <span className="card-reading-time">
                      <IconClockCircle />
                      <span>{generateReadingTime(entry.reading_time)}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <h3 className="card-title">{entry.title}</h3>
          </div>
        </div>
        {children}
      </div>
    </Dropdown>
  )
}

export default ArticleCard
