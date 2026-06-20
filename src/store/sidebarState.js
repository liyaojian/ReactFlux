import { persistentAtom } from "@nanostores/persistent"

import { settingsState } from "./settingsState"

import { extractBasePath } from "@/utils/url"

export const expandedCategoriesState = persistentAtom("expandedCategories", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
})

export const lastVisitedPathState = persistentAtom("lastVisitedPath", "", {
  encode: (value) => value,
  decode: (value) => (typeof value === "string" ? value : ""),
})

const sidebarMenuPathPattern = /^\/(all|today|starred|history|category\/\d+|feed\/\d+)$/

export const isSidebarMenuPath = (path) => sidebarMenuPathPattern.test(path)

export const setLastVisitedPath = (pathname) => {
  const basePath = extractBasePath(pathname)

  if (isSidebarMenuPath(basePath)) {
    lastVisitedPathState.set(basePath)
  }
}

export const getLandingPath = () => {
  const lastPath = lastVisitedPathState.get()

  if (lastPath && isSidebarMenuPath(lastPath)) {
    return lastPath
  }

  return `/${settingsState.get().homePage}`
}

export const setExpandedCategories = (keys) => {
  expandedCategoriesState.set(keys)
}
