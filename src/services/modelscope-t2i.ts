import { fetch } from "undici";

const BASE_URL = "https://api-inference.modelscope.cn/v1";
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 12; // 5s × 12 = 60s

export interface T2IResult {
  url: string;
  taskId: string;
}

export async function createImageTask(
  apiKey: string,
  prompt: string,
  model: string = "Tongyi-MAI/Z-Image-Turbo",
  size: string = "1024x1024"
): Promise<string> {
  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-ModelScope-Async-Mode": "true",
    },
    body: JSON.stringify({ model, prompt, size }),
  });

  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`ModelScope T2I create error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { task_id: string };
  return data.task_id;
}

export async function pollImageTask(
  apiKey: string,
  taskId: string
): Promise<T2IResult> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-ModelScope-Task-Type": "image_generation",
      },
    });

    if (res.status !== 200) {
      continue; // retry on transient errors
    }

    const data = (await res.json()) as {
      task_status: string;
      output_images?: string[];
      message?: string;
    };

    if (data.task_status === "SUCCEED" && data.output_images?.[0]) {
      return { url: data.output_images[0], taskId };
    }

    if (data.task_status === "FAILED") {
      throw new Error(`ModelScope T2I task failed: ${data.message ?? "unknown"}`);
    }
    // PENDING / RUNNING → continue polling
  }

  throw new Error(`ModelScope T2I timeout after ${MAX_POLLS * POLL_INTERVAL_MS / 1000}s`);
}

/** Convenience: create + poll in one call */
export async function generateImage(
  apiKey: string,
  prompt: string,
  model?: string,
  size?: string
): Promise<T2IResult> {
  const taskId = await createImageTask(apiKey, prompt, model, size);
  return pollImageTask(apiKey, taskId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
