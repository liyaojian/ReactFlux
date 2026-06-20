;(function () {
  var doc = document.documentElement
  var sidebarMenuPath = /^\/(all|today|starred|history|category\/\d+|feed\/\d+)$/

  function applyTheme() {
    try {
      var raw = localStorage.getItem("settings")
      var themeMode = "system"

      if (raw) {
        var settings = JSON.parse(raw)
        themeMode = settings.themeMode || "system"
      }

      var isDark =
        themeMode === "dark" ||
        (themeMode === "system" && globalThis.matchMedia("(prefers-color-scheme: dark)").matches)

      doc.dataset.theme = isDark ? "dark" : "light"
      doc.style.colorScheme = isDark ? "dark" : "light"
    } catch {
      /* ignore */
    }
  }

  function applyRedirect() {
    try {
      var path = location.pathname.replace(/\/$/, "") || "/"

      if (path !== "/") {
        return
      }

      var authRaw = localStorage.getItem("auth")

      if (!authRaw) {
        return
      }

      var auth = JSON.parse(authRaw)

      if (!auth.server || !/^https?:\/\//.test(auth.server)) {
        return
      }

      if (!(auth.token || (auth.username && auth.password))) {
        return
      }

      var lastPath = localStorage.getItem("lastVisitedPath") || ""
      var homePage = "all"
      var settingsRaw = localStorage.getItem("settings")

      if (settingsRaw) {
        var settings = JSON.parse(settingsRaw)
        homePage = settings.homePage || "all"
      }

      var target = sidebarMenuPath.test(lastPath) ? lastPath : `/${homePage}`

      history.replaceState(null, "", target + location.search + location.hash)
    } catch {
      /* ignore */
    }
  }

  applyTheme()
  applyRedirect()
})()
