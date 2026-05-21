import { Pool } from "pg";
import { createEmbedding } from "./ai";
import { chunkText, extractTextFromUrl } from "./chunking";

const POSTGRES_URL = process.env.POSTGRES_URL;

const pool = POSTGRES_URL ? new Pool({ connectionString: POSTGRES_URL }) : null;

type ContentForIndexing = {
    _id: { toString(): string };
    userId: { toString(): string };
    title?: string | null;
    link?: string | null;
    body?: string | null;
    contentType?: string | null;
};

export type VectorSearchResult = {
    contentId: string;
    title: string;
    link?: string;
    chunk: string;
    similarity: number;
};

function assertVectorConfigured() {
    if (!pool) {
        throw new Error("POSTGRES_URL is not configured");
    }
}

function toVectorLiteral(embedding: number[]) {
    return `[${embedding.join(",")}]`;
}

export async function initVectorStore() {
    if (!pool) {
        console.warn("POSTGRES_URL is not configured. RAG indexing and chat are disabled.");
        return;
    }

    await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS content_chunks (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            content_id TEXT NOT NULL,
            title TEXT NOT NULL,
            link TEXT,
            chunk_index INTEGER NOT NULL,
            chunk TEXT NOT NULL,
            embedding vector(1536) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE (content_id, chunk_index)
        )
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS content_chunks_embedding_idx
        ON content_chunks USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    `);
    await pool.query(`
        CREATE INDEX IF NOT EXISTS content_chunks_user_id_idx
        ON content_chunks (user_id)
    `);
}

export async function deleteContentEmbeddings(contentId: string) {
    assertVectorConfigured();
    await pool!.query("DELETE FROM content_chunks WHERE content_id = $1", [contentId]);
}

export async function upsertContentEmbeddings(content: ContentForIndexing) {
    assertVectorConfigured();

    const title = content.title || "Untitled";
    const linkText = content.link ? await extractTextFromUrl(content.link) : "";
    const textToIndex = [
        `Title: ${title}`,
        content.body ? `Note: ${content.body}` : "",
        content.link ? `Link: ${content.link}` : "",
        linkText
    ].filter(Boolean).join("\n\n");

    const chunks = chunkText(textToIndex);

    await deleteContentEmbeddings(content._id.toString());

    for (const [index, chunk] of chunks.entries()) {
        const embedding = await createEmbedding(chunk);
        await pool!.query(`
            INSERT INTO content_chunks (user_id, content_id, title, link, chunk_index, chunk, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
            ON CONFLICT (content_id, chunk_index)
            DO UPDATE SET title = EXCLUDED.title, link = EXCLUDED.link, chunk = EXCLUDED.chunk, embedding = EXCLUDED.embedding
        `, [
            content.userId.toString(),
            content._id.toString(),
            title,
            content.link || null,
            index,
            chunk,
            toVectorLiteral(embedding)
        ]);
    }
}

export async function searchUserKnowledge(userId: string, question: string, limit = 6): Promise<VectorSearchResult[]> {
    assertVectorConfigured();

    const embedding = await createEmbedding(question);
    const result = await pool!.query(`
        SELECT content_id, title, link, chunk, 1 - (embedding <=> $2::vector) AS similarity
        FROM content_chunks
        WHERE user_id = $1
        ORDER BY embedding <=> $2::vector
        LIMIT $3
    `, [userId, toVectorLiteral(embedding), limit]);

    return result.rows.map((row) => ({
        contentId: row.content_id,
        title: row.title,
        link: row.link,
        chunk: row.chunk,
        similarity: Number(row.similarity)
    }));
}
