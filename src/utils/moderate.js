import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
  maxRetries: 0,
  timeout: 5000,
});

export const moderateContent = async (text) => {
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: `Is this text free of hate speech, slurs, racism, homophobia, sexual content, and extreme toxicity? Reply with only "yes" or "no".
          
Text: "${text}"`,
        },
      ],
    });

    const result = response.content[0].text.trim().toLowerCase();
    return result === "yes";
  } catch (_err) {
    // If moderation fails, allow the content (blocklist still runs)
    return true;
  }
};
// comment
