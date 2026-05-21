const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || "nvidia/nemotron-nano-9b-v2:free";
const EMBEDDING_PROVIDER = process.env.BRAINLY_EMBEDDING_PROVIDER || "local";
const EMBEDDING_MODEL = process.env.OPENROUTER_EMBEDDING_MODEL || "nvidia/llama-nemotron-embed-vl-1b-v2:free";
const APP_URL = process.env.APP_URL || "http://localhost:5173";
const APP_NAME = process.env.APP_NAME || "Brainly";
const VECTOR_DIMENSIONS = 1536;

type ProviderErrorBody = {
    error?: {
        message?: string;
        type?: string;
        code?: string;
    };
};

export type ChatSource = {
    title: string;
    link?: string;
    contentId: string;
    chunk: string;
};

export class AiServiceError extends Error {
    statusCode: number;
    code?: string;

    constructor(message: string, statusCode = 500, code?: string) {
        super(message);
        this.name = "AiServiceError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

function assertAiConfigured() {
    if (!OPENROUTER_API_KEY) {
        throw new AiServiceError("OPENROUTER_API_KEY is not configured", 503, "missing_api_key");
    }
}

function openRouterHeaders() {
    assertAiConfigured();

    return {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": APP_URL,
        "X-OpenRouter-Title": APP_NAME,
        "Content-Type": "application/json"
    };
}

async function readProviderError(response: Response, action: string) {
    const fallback = `${action} failed with status ${response.status}`;

    try {
        const data = await response.json() as ProviderErrorBody;
        const message = data.error?.message || fallback;
        const code = data.error?.code || data.error?.type;

        if (code === "insufficient_quota") {
            return new AiServiceError("OpenRouter quota or free-model limit was reached. Try a different :free model or retry later.", 402, code);
        }

        return new AiServiceError(message, response.status, code);
    } catch {
        return new AiServiceError(fallback, response.status);
    }
}

function hashText(value: string) {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function normalizeVector(vector: number[]) {
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

    if (!magnitude) {
        return vector;
    }

    return vector.map((value) => value / magnitude);
}

function localEmbedding(input: string) {
    const vector = Array.from({ length: VECTOR_DIMENSIONS }, () => 0);
    const tokens = input.toLowerCase().match(/[a-z0-9]+/g) || [];

    for (const token of tokens) {
        const hash = hashText(token);
        const index = hash % VECTOR_DIMENSIONS;
        const sign = hash % 2 === 0 ? 1 : -1;
        vector[index] += sign;
    }

    return normalizeVector(vector);
}

function fitVectorDimensions(embedding: number[]) {
    if (embedding.length === VECTOR_DIMENSIONS) {
        return normalizeVector(embedding);
    }

    const vector = Array.from({ length: VECTOR_DIMENSIONS }, () => 0);

    for (const [index, value] of embedding.entries()) {
        vector[index % VECTOR_DIMENSIONS] += value;
    }

    return normalizeVector(vector);
}

export async function createEmbedding(input: string): Promise<number[]> {
    if (EMBEDDING_PROVIDER === "local") {
        return localEmbedding(input);
    }

    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: openRouterHeaders(),
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input,
            encoding_format: "float"
        })
    });

    if (!response.ok) {
        throw await readProviderError(response, "Embedding request");
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return fitVectorDimensions(data.data[0].embedding);
}

export async function answerFromContext(question: string, sources: ChatSource[]) {
    const context = sources.map((source, index) => {
        return `Source ${index + 1}: ${source.title}\n${source.link ? `Link: ${source.link}\n` : ""}${source.chunk}`;
    }).join("\n\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders(),
        body: JSON.stringify({
            model: CHAT_MODEL,
            temperature: 0.2,
            max_tokens: 700,
            messages: [
                {
                    role: "system",
                    content: "You are Brainly, a second-brain assistant. Answer only from the provided context. If the answer is not in the context, say you do not have enough saved knowledge yet. Cite source titles naturally."
                },
                {
                    role: "user",
                    content: `Question: ${question}\n\nSaved knowledge:\n${context || "No matching saved knowledge found."}`
                }
            ]
        })
    });

    if (!response.ok) {
        throw await readProviderError(response, "Chat request");
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
}
