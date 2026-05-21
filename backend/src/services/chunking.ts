export function chunkText(text: string, maxChunkLength = 1200, overlapLength = 160) {
    const normalized = text.replace(/\s+/g, " ").trim();

    if (!normalized) {
        return [];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
        const end = Math.min(start + maxChunkLength, normalized.length);
        chunks.push(normalized.slice(start, end));

        if (end === normalized.length) {
            break;
        }

        start = Math.max(end - overlapLength, start + 1);
    }

    return chunks;
}

export async function extractTextFromUrl(url: string) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
            return "";
        }

        const html = await response.text();
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 12000);
    } catch {
        return "";
    }
}
