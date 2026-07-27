import { IconRight, IconStarFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { priorityUnreadCountState } from "@/store/priorityFeedsState"
import { setPriorityFeedsExpanded, setSidebarDrawerVisible } from "@/store/sidebarState"

import "./PriorityUnreadReminder.css"

const handleReminderClick = () => {
  setPriorityFeedsExpanded(true)
  setSidebarDrawerVisible(true)
}

const PriorityUnreadReminder = () => {
  const { polyglot } = useStore(polyglotState)
  const unreadCount = useStore(priorityUnreadCountState)
  const { isBelowMedium } = useScreenWidth()

  if (!isBelowMedium || unreadCount <= 0) {
    return null
  }

  const priorityFeedsLabel = polyglot.t("sidebar.priority_feeds")
  const unreadCountLabel = polyglot.t("article_list.priority_unread_count", {
    count: unreadCount,
  })

  return (
    <button
      aria-label={`${priorityFeedsLabel}, ${unreadCountLabel}`}
      className="priority-unread-reminder"
      type="button"
      onClick={handleReminderClick}
    >
      <span aria-hidden="true" className="priority-unread-reminder__icon">
        <IconStarFill className="priority-unread-reminder__star" />
      </span>
      <span className="priority-unread-reminder__content">
        <span className="priority-unread-reminder__title">{priorityFeedsLabel}</span>
        <span className="priority-unread-reminder__count">{unreadCountLabel}</span>
      </span>
      <span aria-hidden="true" className="priority-unread-reminder__badge">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
      <IconRight aria-hidden="true" className="priority-unread-reminder__arrow" />
    </button>
  )
}

export default PriorityUnreadReminder
