export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text) return res.status(400).json({ allowed: true });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // eslint-disable-next-line no-undef
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: `Is this text free of hate speech, slurs, racism, homophobia, sexual content, and extreme toxicity? Reply with only "yes" or "no".

Text: "${text}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const result = data.content?.[0]?.text?.trim().toLowerCase();
    return res.status(200).json({ allowed: result === "yes" });
  } catch {
    // If moderation fails, allow the content (blocklist still runs)
    return res.status(200).json({ allowed: true });
  }
}
