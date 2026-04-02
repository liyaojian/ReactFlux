import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"

const SHOW_STATUS_SESSION_KEY = "settings:showStatus"
const ORDER_DIRECTION_SESSION_KEY = "settings:orderDirection"
const LAYOUT_FULLSCREEN_SESSION_KEY = "settings:layoutFullscreen"
const validShowStatus = new Set(["all", "starred", "unread"])
const validOrderDirection = new Set(["asc", "desc"])
const validLayoutFullscreen = new Set(["false", "true"])

const defaultValue = {
  articleWidth: 75,
  coverDisplayMode: "auto",
  edgeToEdgeImages: false,
  enableContextMenu: true,
  enableSwipeGesture: true,
  enableSwipeLeftToOpenLink: false,
  fontFamily: "system-ui",
  fontSize: 1.05,
  homePage: "all",
  language: getBrowserLanguage(),
  layoutFullscreen: false,
  lightboxSlideAnimation: true,
  markReadBy: "view",
  markReadOnScroll: false,
  openaiApiKey: "",
  openaiBaseUrl: "https://api.openai.com",
  openaiModel: "gpt-4o-mini",
  orderBy: "published_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showDetailedRelativeTime: false,
  showEstimatedReadingTime: false,
  showFeedIcon: true,
  showHiddenFeeds: false,
  sortSidebarCategoriesByUnreadCount: false,
  showStatus: "unread",
  showUnreadFeedsOnly: false,
  swipeSensitivity: 1,
  themeColor: "Blue",
  themeMode: "system",
  titleAlignment: "center",
  updateContentOnFetch: false,
}

const getSessionStorage = () => {
  if (typeof globalThis === "undefined") {
    return null
  }

  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

const getStoredShowStatus = () => {
  const sessionStorage = getSessionStorage()
  const storedShowStatus = sessionStorage?.getItem(SHOW_STATUS_SESSION_KEY)

  if (storedShowStatus && validShowStatus.has(storedShowStatus)) {
    return storedShowStatus
  }

  return defaultValue.showStatus
}

const getStoredOrderDirection = () => {
  const sessionStorage = getSessionStorage()
  const storedOrderDirection = sessionStorage?.getItem(ORDER_DIRECTION_SESSION_KEY)

  if (storedOrderDirection && validOrderDirection.has(storedOrderDirection)) {
    return storedOrderDirection
  }

  return defaultValue.orderDirection
}

const getStoredLayoutFullscreen = () => {
  const sessionStorage = getSessionStorage()
  const storedLayoutFullscreen = sessionStorage?.getItem(LAYOUT_FULLSCREEN_SESSION_KEY)

  if (storedLayoutFullscreen && validLayoutFullscreen.has(storedLayoutFullscreen)) {
    return storedLayoutFullscreen === "true"
  }

  return defaultValue.layoutFullscreen
}

const syncShowStatusToSession = (showStatus) => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  if (validShowStatus.has(showStatus)) {
    sessionStorage.setItem(SHOW_STATUS_SESSION_KEY, showStatus)
    return
  }

  sessionStorage.removeItem(SHOW_STATUS_SESSION_KEY)
}

const syncOrderDirectionToSession = (orderDirection) => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  if (validOrderDirection.has(orderDirection)) {
    sessionStorage.setItem(ORDER_DIRECTION_SESSION_KEY, orderDirection)
    return
  }

  sessionStorage.removeItem(ORDER_DIRECTION_SESSION_KEY)
}

const syncLayoutFullscreenToSession = (layoutFullscreen) => {
  const sessionStorage = getSessionStorage()

  if (!sessionStorage) {
    return
  }

  if (typeof layoutFullscreen === "boolean") {
    sessionStorage.setItem(LAYOUT_FULLSCREEN_SESSION_KEY, String(layoutFullscreen))
    return
  }

  sessionStorage.removeItem(LAYOUT_FULLSCREEN_SESSION_KEY)
}

const clampNumber = (value, min, max, fallback) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return fallback
  }
  return Math.min(max, Math.max(min, numericValue))
}

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: (value) => {
    const filteredValue = {}

    for (const key in value) {
      if (
        key in defaultValue &&
        key !== "showStatus" &&
        key !== "orderDirection" &&
        key !== "layoutFullscreen"
      ) {
        filteredValue[key] = value[key]
      }
    }

    return JSON.stringify(filteredValue)
  },
  decode: (str) => {
    const storedValue = JSON.parse(str)
    const {
      layoutFullscreen: legacyLayoutFullscreen,
      orderDirection: legacyOrderDirection,
      showStatus: legacyShowStatus,
      ...restStoredValue
    } = storedValue
    const layoutFullscreen = getStoredLayoutFullscreen()
    const orderDirection = getStoredOrderDirection()
    const showStatus = getStoredShowStatus()
    const mergedValue = {
      ...defaultValue,
      ...restStoredValue,
      layoutFullscreen,
      orderDirection,
      showStatus,
    }

    if (
      layoutFullscreen === defaultValue.layoutFullscreen &&
      typeof legacyLayoutFullscreen === "boolean"
    ) {
      mergedValue.layoutFullscreen = legacyLayoutFullscreen
      syncLayoutFullscreenToSession(legacyLayoutFullscreen)
    }

    if (
      orderDirection === defaultValue.orderDirection &&
      validOrderDirection.has(legacyOrderDirection)
    ) {
      mergedValue.orderDirection = legacyOrderDirection
      syncOrderDirectionToSession(legacyOrderDirection)
    }

    if (showStatus === defaultValue.showStatus && validShowStatus.has(legacyShowStatus)) {
      mergedValue.showStatus = legacyShowStatus
      syncShowStatusToSession(legacyShowStatus)
    }

    return {
      ...mergedValue,
      articleWidth: clampNumber(mergedValue.articleWidth, 50, 100, defaultValue.articleWidth),
      fontSize: clampNumber(mergedValue.fontSize, 0.75, 1.25, defaultValue.fontSize),
    }
  },
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) => {
  const nextSettings = { ...settingsState.get(), ...settingsChanges }

  if ("layoutFullscreen" in settingsChanges) {
    syncLayoutFullscreenToSession(nextSettings.layoutFullscreen)
  }

  if ("orderDirection" in settingsChanges) {
    syncOrderDirectionToSession(nextSettings.orderDirection)
  }

  if ("showStatus" in settingsChanges) {
    syncShowStatusToSession(nextSettings.showStatus)
  }

  settingsState.set(nextSettings)
}

export const resetSettings = () => {
  syncLayoutFullscreenToSession(defaultValue.layoutFullscreen)
  syncOrderDirectionToSession(defaultValue.orderDirection)
  syncShowStatusToSession(defaultValue.showStatus)
  settingsState.set(defaultValue)
}
