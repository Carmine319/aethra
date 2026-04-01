type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string; code?: number };
};

export async function callLLM(prompt: string, model = "openrouter/auto") {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  let data: OpenRouterChatResponse;
  try {
    data = (await res.json()) as OpenRouterChatResponse;
  } catch {
    throw new Error(`OpenRouter: invalid JSON response (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const detail =
      typeof data.error?.message === "string"
        ? data.error.message
        : `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`OpenRouter: ${detail}`);
  }

  return data.choices?.[0]?.message?.content || "";
}
