import { authState } from "@/store/authState"
import { getLandingPath } from "@/store/sidebarState"
import isValidAuth from "@/utils/auth"

const normalizeBasename = (basename) => basename.replace(/\/$/, "")

const stripBasename = (pathname, basename) => {
  const base = normalizeBasename(basename)

  if (!base) {
    return pathname || "/"
  }

  if (pathname.startsWith(base)) {
    return pathname.slice(base.length) || "/"
  }

  return pathname
}

const withBasename = (path, basename) => {
  const base = normalizeBasename(basename)

  if (!base) {
    return path
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

const applyStartupRedirect = () => {
  const basename = import.meta.env.BASE_URL || "/"
  const pathname = stripBasename(globalThis.location.pathname, basename)

  if (!isValidAuth(authState.get()) || pathname !== "/") {
    return
  }

  const target = withBasename(getLandingPath(), basename)

  if (target !== globalThis.location.pathname) {
    globalThis.history.replaceState(
      null,
      "",
      target + globalThis.location.search + globalThis.location.hash,
    )
  }
}

export default applyStartupRedirect
