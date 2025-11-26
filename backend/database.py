"""Database connection with in-memory fallback."""

from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging
import os

logger = logging.getLogger(__name__)

# Global database client
client: Any = None
db: Any = None


class MemoryInsertResult:
    def __init__(self, inserted_id: str = None):
        self.inserted_id = inserted_id


class MemoryDeleteResult:
    def __init__(self, deleted_count: int = 0):
        self.deleted_count = deleted_count


class MemoryUpdateResult:
    def __init__(self, matched_count: int = 0, modified_count: int = 0, upserted_id: Optional[str] = None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class MemoryCursor:
    """Minimal async cursor supporting find + sort + iteration."""

    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs

    def sort(self, key: str, direction: int):
        reverse = direction == -1
        self.docs = sorted(self.docs, key=lambda d: d.get(key), reverse=reverse)
        return self

    def __aiter__(self):
        self._iter = iter(self.docs)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration


class MemoryCollection:
    """Very small in-memory collection that mimics Motor calls used in this app."""

    def __init__(self):
        self.docs: List[Dict[str, Any]] = []

    async def insert_one(self, doc: Dict[str, Any]):
        self.docs.append(dict(doc))
        return MemoryInsertResult(inserted_id=doc.get("_id"))

    async def insert_many(self, docs: List[Dict[str, Any]]):
        for doc in docs:
            self.docs.append(dict(doc))
        return MemoryInsertResult()

    async def delete_many(self, filter_doc: Dict[str, Any]):
        original_count = len(self.docs)
        self.docs = [
            doc for doc in self.docs
            if not all(doc.get(k) == v for k, v in filter_doc.items())
        ]
        return MemoryDeleteResult(deleted_count=original_count - len(self.docs))

    async def find_one(self, filter_doc: Dict[str, Any]):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                return dict(doc)
        return None

    def find(self, filter_doc: Dict[str, Any]):
        matched = [
            dict(doc) for doc in self.docs
            if all(doc.get(k) == v for k, v in filter_doc.items())
        ]
        return MemoryCursor(matched)

    async def update_one(self, filter_doc: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_fields = update.get("$set", {})
        for idx, doc in enumerate(self.docs):
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                self.docs[idx] = {**doc, **set_fields}
                return MemoryUpdateResult(matched_count=1, modified_count=1)
        if upsert:
            new_doc = {**filter_doc, **set_fields}
            self.docs.append(new_doc)
            return MemoryUpdateResult(matched_count=0, modified_count=1, upserted_id=new_doc.get("_id"))
        return MemoryUpdateResult()

    async def find_one_and_update(
        self,
        filter_doc: Dict[str, Any],
        update: Dict[str, Any],
        return_document: bool = True,
        upsert: bool = False,
    ):
        for idx, doc in enumerate(self.docs):
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                set_fields = update.get("$set", {})
                set_on_insert = update.get("$setOnInsert", {})
                self.docs[idx] = {**doc, **set_fields, **set_on_insert}
                return dict(self.docs[idx])
        if upsert:
            new_doc = {**filter_doc}
            new_doc.update(update.get("$setOnInsert", {}))
            new_doc.update(update.get("$set", {}))
            self.docs.append(new_doc)
            return dict(new_doc)
        return None

    async def delete_one(self, filter_doc: Dict[str, Any]):
        for idx, doc in enumerate(self.docs):
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                self.docs.pop(idx)
                return MemoryDeleteResult(deleted_count=1)
        return MemoryDeleteResult(deleted_count=0)


class MemoryDB:
    """Container for named collections."""

    def __init__(self):
        self.collections: Dict[str, MemoryCollection] = {}

    def __getitem__(self, name: str) -> MemoryCollection:
        if name not in self.collections:
            self.collections[name] = MemoryCollection()
        return self.collections[name]


class MemoryClient:
    """Simple client wrapper mirroring motor interface we rely on."""

    def __init__(self):
        self.databases: Dict[str, MemoryDB] = {}

    def __getitem__(self, name: str) -> MemoryDB:
        if name not in self.databases:
            self.databases[name] = MemoryDB()
        return self.databases[name]

    @property
    def admin(self):
        class Admin:
            async def command(self, *_args, **_kwargs):
                return {"ok": 1}
        return Admin()

    def close(self):
        """No-op for in-memory."""
        return None


async def init_db():
    """Initialize database connection with automatic in-memory fallback."""
    global client, db
    use_memory = os.environ.get("USE_IN_MEMORY_DB", "").lower() == "true"

    if use_memory:
        client = MemoryClient()
        db = client[settings.database_name]
        logger.warning("Using in-memory database (USE_IN_MEMORY_DB=true)")
        return

    try:
        client = AsyncIOMotorClient(settings.mongo_url)
        db = client[settings.database_name]
        await client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.database_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB, falling back to in-memory store: {e}")
        client = MemoryClient()
        db = client[settings.database_name]
        logger.warning("Using in-memory database fallback. Data will not persist between restarts.")


async def close_db():
    """Close database connection."""
    global client
    if client and hasattr(client, "close"):
        client.close()
        logger.info("Closed database connection")


def get_db():
    """Get database instance."""
    return db
