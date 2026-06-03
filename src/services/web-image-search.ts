import { fetch } from "undici";

export interface ImageCandidate {
  source: "unsplash" | "pexels" | "flickr-cc";
  url: string;
  thumbUrl?: string;
  author?: string;
  license?: string;
}

const UA = "Mozilla/5.0 (compatible; social-card-mcp/0.1.0)";

/**
 * Search Unsplash by scraping the search page (no API key needed).
 * Extracts image URLs from the HTML response.
 */
async function searchUnsplash(keyword: string, maxResults: number = 5): Promise<ImageCandidate[]> {
  try {
    const url = `https://unsplash.com/s/photos/${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
    });
    if (res.status !== 200) return [];

    const html = await res.text();
    // Unsplash embeds image URLs as src="https://images.unsplash.com/photo-..."
    const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9_-]+/g;
    const matches = [...new Set(html.match(regex) ?? [])].slice(0, maxResults);

    return matches.map((u) => ({
      source: "unsplash" as const,
      url: `${u}?w=1080&q=80`,
      thumbUrl: `${u}?w=400&q=60`,
      license: "Unsplash License (free)",
    }));
  } catch {
    return [];
  }
}

/**
 * Search Pexels by scraping the search page (no API key needed).
 */
async function searchPexels(keyword: string, maxResults: number = 5): Promise<ImageCandidate[]> {
  try {
    const url = `https://www.pexels.com/search/${encodeURIComponent(keyword)}/`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
    });
    if (res.status !== 200) return [];

    const html = await res.text();
    // Pexels uses data-src or src with images.pexels.com URLs
    const regex = /https:\/\/images\.pexels\.com\/photos\/\d+\/[a-zA-Z0-9_-]+/g;
    const matches = [...new Set(html.match(regex) ?? [])].slice(0, maxResults);

    return matches.map((u) => ({
      source: "pexels" as const,
      url: `${u}?w=1080&q=80`,
      thumbUrl: `${u}?w=400&q=60`,
      license: "Pexels License (free)",
    }));
  } catch {
    return [];
  }
}

/**
 * Search Flickr CC-licensed images by scraping the search page (no API key needed).
 */
async function searchFlickrCC(keyword: string, maxResults: number = 5): Promise<ImageCandidate[]> {
  try {
    const url = `https://www.flickr.com/search/?text=${encodeURIComponent(keyword)}&license=2,3,4,5,6,9`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "text/html" },
    });
    if (res.status !== 200) return [];

    const html = await res.text();
    // Flickr uses live.staticflickr.com URLs
    const regex = /https:\/\/live\.staticflickr\.com\/\d+\/\d+_[a-f0-9]+_[a-z]+\.jpg/g;
    const matches = [...new Set(html.match(regex) ?? [])].slice(0, maxResults);

    return matches.map((u) => ({
      source: "flickr-cc" as const,
      // Convert thumbnail suffix (_m/_s/_q) to medium (_z) or large (_b)
      url: u.replace(/_[a-z]\.jpg$/, "_z.jpg"),
      thumbUrl: u.replace(/_[a-z]\.jpg$/, "_m.jpg"),
      license: "CC (check individual license)",
    }));
  } catch {
    return [];
  }
}

/**
 * Search all 3 image sources in parallel and return combined results.
 * Never throws — returns partial results on failure.
 */
export async function searchWebImages(
  keyword: string,
  maxPerSource: number = 3
): Promise<ImageCandidate[]> {
  const [unsplash, pexels, flickr] = await Promise.allSettled([
    searchUnsplash(keyword, maxPerSource),
    searchPexels(keyword, maxPerSource),
    searchFlickrCC(keyword, maxPerSource),
  ]);

  const results: ImageCandidate[] = [];

  if (unsplash.status === "fulfilled") results.push(...unsplash.value);
  if (pexels.status === "fulfilled") results.push(...pexels.value);
  if (flickr.status === "fulfilled") results.push(...flickr.value);

  return results;
}
