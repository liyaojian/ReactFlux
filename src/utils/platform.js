const detectIOSSafari = () => {
  if (globalThis.navigator === undefined) {
    return false
  }

  const { userAgent, platform, maxTouchPoints } = globalThis.navigator
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1)
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)

  return isIOSDevice && isSafari
}

export const IS_IOS_SAFARI = detectIOSSafari()

export const initPlatformClass = () => {
  if (IS_IOS_SAFARI) {
    document.documentElement.classList.add("ios-safari")
  }
}

export const getEntryListRoot = (entryListRef) => entryListRef.current?.el ?? entryListRef.current

export const getEntryListScrollElement = (entryListRef) => {
  const node = entryListRef.current
  if (!node) {
    return null
  }

  if (node.contentWrapperEl) {
    return node.contentWrapperEl
  }

  return node.querySelector?.(".simplebar-content-wrapper") ?? node
}

export const getArticleScrollElement = (articleElement) =>
  articleElement?.querySelector(".simplebar-content-wrapper") ??
  articleElement?.querySelector(".scroll-container-native") ??
  articleElement?.querySelector(".scroll-container")
