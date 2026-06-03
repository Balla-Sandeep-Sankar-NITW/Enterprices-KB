"""
Pinecone Vector Store Service
- Fully managed cloud vector DB
- Free tier: 1 index, 100K vectors
- Department filtering via Pinecone metadata filters
- No local storage, no RAM usage
"""
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings
from app.services.embedding_service import get_embeddings, get_single_embedding, EMBEDDING_DIMENSION

_pinecone_client: Optional[Pinecone] = None
_pinecone_index = None


def get_pinecone_client() -> Pinecone:
    global _pinecone_client
    if _pinecone_client is None:
        if not settings.PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY not set in .env")
        _pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
    return _pinecone_client


def get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        pc = get_pinecone_client()
        index_name = settings.PINECONE_INDEX_NAME

        # Create index if it doesn't exist
        existing = [i.name for i in pc.list_indexes()]
        if index_name not in existing:
            print(f"[Pinecone] Creating index '{index_name}'...")
            pc.create_index(
                name=index_name,
                dimension=EMBEDDING_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud=settings.PINECONE_CLOUD,
                    region=settings.PINECONE_REGION,
                )
            )
            print(f"[Pinecone] ✅ Index '{index_name}' created")
        else:
            print(f"[Pinecone] ✅ Index '{index_name}' ready")

        _pinecone_index = pc.Index(index_name)
    return _pinecone_index


def init_pinecone():
    """Call on startup to initialize connection."""
    try:
        get_pinecone_index()
        return True
    except Exception as e:
        print(f"[Pinecone] ❌ Init failed: {e}")
        return False


# ─────────────────────────────────────────
# Store
# ─────────────────────────────────────────

async def store_chunks(
    department_id: int,
    document_id: int,
    chunks: List[Dict[str, Any]]
):
    """
    Embed and upsert chunks into Pinecone.
    Each vector has metadata for department filtering.
    """
    if not chunks:
        return

    index = get_pinecone_index()

    # Delete existing vectors for this document
    try:
        index.delete(filter={"document_id": document_id})
    except Exception:
        pass

    texts = [c["text"] for c in chunks]
    embeddings = await get_embeddings(texts)

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vector_id = f"doc_{document_id}_chunk_{i}"
        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "document_id": document_id,
                "department_id": department_id,
                "document_title": chunk.get("metadata", {}).get("document_title", ""),
                "page": chunk.get("page", 1),
                "chunk_index": i,
                "text": chunk["text"][:1000],  # Pinecone metadata limit
            }
        })

    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        index.upsert(vectors=vectors[i:i + batch_size])

    print(f"[Pinecone] Stored {len(vectors)} chunks for document {document_id}")


def delete_document_vectors(document_id: int):
    """Delete all vectors for a document."""
    try:
        index = get_pinecone_index()
        index.delete(filter={"document_id": document_id})
        print(f"[Pinecone] Deleted vectors for document {document_id}")
    except Exception as e:
        print(f"[Pinecone] Warning: Could not delete vectors: {e}")


# ─────────────────────────────────────────
# Retrieve
# ─────────────────────────────────────────

async def retrieve_chunks(
    query: str,
    department_id: int,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Retrieve top-k relevant chunks from Pinecone.
    Filters by department_id so users only get their dept's docs.
    """
    index = get_pinecone_index()
    query_embedding = await get_single_embedding(query)

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        filter={"department_id": {"$eq": department_id}},
        include_metadata=True,
    )

    chunks = []
    for match in results.matches:
        chunks.append({
            "text": match.metadata.get("text", ""),
            "score": round(match.score, 4),
            "metadata": {
                "document_id": match.metadata.get("document_id"),
                "document_title": match.metadata.get("document_title", "Unknown"),
                "department_id": match.metadata.get("department_id"),
                "page": match.metadata.get("page"),
                "chunk_index": match.metadata.get("chunk_index"),
            }
        })

    return chunks


# ─────────────────────────────────────────
# Contextualized Query
# ─────────────────────────────────────────

def build_contextualized_query(
    current_question: str,
    chat_history: List[Dict[str, str]],
    max_history: int = 3
) -> str:
    """
    Improve retrieval by resolving pronouns using recent chat history.
    e.g. 'Can they be carried forward?' → 'Can annual leaves be carried forward?'
    """
    if not chat_history:
        return current_question

    pronouns = {"they", "them", "it", "this", "that", "these", "those"}
    words = set(current_question.lower().split())

    if words & pronouns:
        recent = chat_history[-max_history:]
        recent_user_qs = [m["content"] for m in recent if m["role"] == "user"]
        if recent_user_qs:
            context_hint = recent_user_qs[-1][:200]
            return f"{context_hint} {current_question}"

    return current_question
