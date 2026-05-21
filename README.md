# brainly

AI-powered second brain app.

## Project Notes

https://petal-estimate-4e9.notion.site/Building-a-second-brain-app-1407dfd1073580c19ac3cbe9afa9ac27

## RAG setup

The app keeps user/content records in MongoDB and stores searchable knowledge chunks in Postgres with pgvector.

Backend environment:

```env
MONGO_URL=mongodb://localhost:27017/brainly
USER_JWT_SECRET=replace-with-a-long-secret
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_CHAT_MODEL=nvidia/nemotron-nano-9b-v2:free
BRAINLY_EMBEDDING_PROVIDER=local
OPENROUTER_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free
APP_URL=http://localhost:5173
APP_NAME=Brainly
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/brainly
```

OpenRouter still needs an API key, even for free models. The default chat model above is a free OpenRouter model at the time this project was updated. Free model availability and rate limits can change, so if it stops responding, pick another model ending in `:free` from OpenRouter and update `OPENROUTER_CHAT_MODEL`.

`BRAINLY_EMBEDDING_PROVIDER=local` keeps note/link indexing free by generating deterministic local vectors before storing them in pgvector. Set it to `openrouter` only if you want to use OpenRouter's embeddings endpoint.

Postgres needs pgvector enabled. With Docker, one simple local option is:

```bash
docker run --name brainly-pgvector -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=brainly -p 5432:5432 -d pgvector/pgvector:pg16
```

Run the apps:

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

When a user saves a note/link/video/tweet, the backend chunks it, embeds it, stores it in `content_chunks`, and `/api/v1/brain/chat` retrieves the closest chunks before answering.

## Example

Here is the AI-powered second brain answering from saved content:

![Brainly dashboard example](assets/brainly-demo.png)