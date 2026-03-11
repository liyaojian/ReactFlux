export const fetchAISummary = async (text, config) => {
  const { openaiBaseUrl, openaiApiKey, openaiModel } = config

  if (!openaiApiKey) {
    throw new Error("API Key is missing")
  }

  // Normalize baseUrl mapping
  let baseUrl = openaiBaseUrl || "https://api.openai.com"
  if (!baseUrl.endsWith("/v1")) {
    baseUrl = `${baseUrl.replace(/\/$/, "")}/v1`
  }

  const systemPrompt = `你是一个非常专业的文章摘要助手。请用一段简明扼要的话总结下面这篇文章的核心内容（最好不超过200字）。`

  const payload = {
    model: openaiModel || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0.5,
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP Request Failed: ${response.status}`)
    }

    const data = await response.json()
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content
    } else {
      throw new Error("No completion choices returned by the API")
    }
  } catch (error) {
    console.error("fetchAISummary error:", error)
    throw error
  }
}

export const stripHtmlAndGetText = (htmlStr) => {
  if (!htmlStr) {
    return ""
  }
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div")
  // Using DOMParser to safely extract text
  const doc = new DOMParser().parseFromString(htmlStr, "text/html")
  tempDiv.append(doc.documentElement)

  // Extract pure text and normalize whitespaces
  return tempDiv.textContent
    .replaceAll(String.raw`\n`, " ")
    .replaceAll(/\\s+/g, " ")
    .trim()
}
