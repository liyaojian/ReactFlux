import { persistentAtom } from "@nanostores/persistent"
import { computed } from "nanostores"

import { authState } from "./authState"
import { dataState } from "./dataState"

const normalizeStoredAccounts = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([accountKey, feedIds]) => [
      accountKey,
      Array.isArray(feedIds)
        ? [...new Set(feedIds.map(Number).filter((feedId) => Number.isSafeInteger(feedId)))]
        : [],
    ]),
  )
}

const priorityFeedsByAccountState = persistentAtom(
  "priorityFeeds",
  {},
  {
    encode: JSON.stringify,
    decode: (value) => {
      try {
        return normalizeStoredAccounts(JSON.parse(value))
      } catch {
        return {}
      }
    },
  },
)

const currentAccountKeyState = computed([authState, dataState], (auth, data) => {
  if (!auth.server || !Number.isSafeInteger(data.currentUserId)) {
    return ""
  }

  const normalizedServer = auth.server.replace(/\/+$/, "")
  return `${normalizedServer}::${data.currentUserId}`
})

export const priorityFeedIdsState = computed(
  [priorityFeedsByAccountState, currentAccountKeyState],
  (priorityFeedsByAccount, accountKey) => priorityFeedsByAccount[accountKey] ?? [],
)

const updateCurrentAccountFeedIds = (updater) => {
  const accountKey = currentAccountKeyState.get()
  if (!accountKey) {
    return
  }

  const priorityFeedsByAccount = priorityFeedsByAccountState.get()
  const currentFeedIds = priorityFeedsByAccount[accountKey] ?? []
  const nextFeedIds = updater(currentFeedIds)

  if (nextFeedIds === currentFeedIds) {
    return
  }

  priorityFeedsByAccountState.set({
    ...priorityFeedsByAccount,
    [accountKey]: nextFeedIds,
  })
}

export const togglePriorityFeed = (feedId) => {
  const normalizedFeedId = Number(feedId)
  if (!Number.isSafeInteger(normalizedFeedId)) {
    return
  }

  updateCurrentAccountFeedIds((feedIds) =>
    feedIds.includes(normalizedFeedId)
      ? feedIds.filter((id) => id !== normalizedFeedId)
      : [...feedIds, normalizedFeedId],
  )
}

export const removePriorityFeed = (feedId) => {
  const normalizedFeedId = Number(feedId)
  updateCurrentAccountFeedIds((feedIds) => feedIds.filter((id) => id !== normalizedFeedId))
}

export const prunePriorityFeeds = (feeds) => {
  if (feeds.length === 0) {
    return
  }

  const validFeedIds = new Set(feeds.map((feed) => Number(feed.id)))

  updateCurrentAccountFeedIds((feedIds) => {
    const nextFeedIds = feedIds.filter((id) => validFeedIds.has(id))
    return nextFeedIds.length === feedIds.length ? feedIds : nextFeedIds
  })
}

export const clearCurrentPriorityFeeds = () => {
  const accountKey = currentAccountKeyState.get()
  if (!accountKey) {
    return
  }

  const priorityFeedsByAccount = { ...priorityFeedsByAccountState.get() }
  delete priorityFeedsByAccount[accountKey]
  priorityFeedsByAccountState.set(priorityFeedsByAccount)
}
