import { fetch } from "undici";

const BASE_URL = "https://api-inference.modelscope.cn/v1";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  text: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function chatCompletion(
  apiKey: string,
  messages: LLMMessage[],
  model: string = "Qwen/Qwen3.5-35B-A3B"
): Promise<LLMResponse> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`ModelScope LLM API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices[0]?.message?.content ?? "",
    usage: data.usage,
  };
}