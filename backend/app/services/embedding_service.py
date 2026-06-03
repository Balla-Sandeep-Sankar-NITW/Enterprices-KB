"""
Voyage AI Embedding Service
- No local model downloaded
- No GPU usage
- API call: ~5ms per batch
- Free tier: 50M tokens/month
- Model: voyage-2 (1024 dimensions, excellent quality)
"""
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"
EMBEDDING_DIMENSION = 1024  # voyage-2 output dimension


async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Get embeddings from Voyage AI API.
    Batches up to 128 texts per request.
    """
    if not texts:
        return []

    if not settings.VOYAGE_API_KEY:
        raise ValueError("VOYAGE_API_KEY not set in .env")

    all_embeddings = []
    batch_size = 128

    async with httpx.AsyncClient(timeout=60.0) as client:
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await client.post(
                VOYAGE_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.VOYAGE_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "input": batch,
                    "model": settings.VOYAGE_EMBEDDING_MODEL,
                }
            )
            response.raise_for_status()
            data = response.json()
            batch_embeddings = [item["embedding"] for item in data["data"]]
            all_embeddings.extend(batch_embeddings)

    return all_embeddings


async def get_single_embedding(text: str) -> List[float]:
    """Get embedding for a single text (for query embedding)."""
    embeddings = await get_embeddings([text])
    return embeddings[0]
