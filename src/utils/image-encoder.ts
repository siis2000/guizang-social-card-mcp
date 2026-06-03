import { fetch } from "undici";

export async function encodeImageToBase64(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "social-card-mcp/0.1.0" },
  });
  if (res.status !== 200) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
