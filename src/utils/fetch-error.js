const normalizeFetchError = (error, serverUrl = "") => {
  if (!(error instanceof TypeError)) {
    return error
  }

  const message = error.message?.toLowerCase() ?? ""
  const isSecurePage = globalThis.location?.protocol === "https:"
  const isInsecureServer = serverUrl.startsWith("http://")

  if (message.includes("load failed") || message.includes("failed to fetch")) {
    if (isSecurePage && isInsecureServer) {
      return new Error(
        "Safari blocked the request because the Miniflux server uses HTTP on an HTTPS page. Use an HTTPS server URL.",
      )
    }

    return new Error(
      "Network request failed. Check the server URL, CORS settings, and network connection.",
    )
  }

  return error
}

export default normalizeFetchError
