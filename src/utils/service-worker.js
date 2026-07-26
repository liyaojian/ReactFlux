import { registerSW } from "virtual:pwa-register"

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) {
    return
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_serviceWorkerUrl, registration) {
      if (!registration) {
        return
      }

      let lastUpdateCheck = 0

      const checkForUpdate = () => {
        if (!registration.active) {
          return
        }

        const now = Date.now()
        const isVisible = document.visibilityState === "visible"
        const isOnline = navigator.onLine !== false

        if (!isVisible || !isOnline || now - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) {
          return
        }

        lastUpdateCheck = now
        registration.update().catch((error) => {
          console.error("Service worker update check failed", error)
        })
      }

      document.addEventListener("visibilitychange", checkForUpdate)
      globalThis.addEventListener("pageshow", checkForUpdate)
      globalThis.addEventListener("online", checkForUpdate)
      globalThis.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
      checkForUpdate()
    },
    onRegisterError(error) {
      console.error("Service worker registration failed", error)
    },
  })
}

export default registerServiceWorker
