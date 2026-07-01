import { openDB } from "idb";

const DB_NAME = "docusync";
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Documents store
      if (!db.objectStoreNames.contains("documents")) {
        const docStore = db.createObjectStore("documents", { keyPath: "id" });
        docStore.createIndex("updatedAt", "updatedAt");
      }
      // Sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("documentId", "documentId");
        syncStore.createIndex("status", "status");
      }
    },
  });
}

// Save document locally
export async function saveDocumentLocally(document) {
  const db = await getDB();
  await db.put("documents", {
    ...document,
    updatedAt: new Date().toISOString(),
    synced: false,
  });
}

// Get document from local DB
export async function getLocalDocument(id) {
  const db = await getDB();
  return db.get("documents", id);
}

// Add to sync queue
export async function addToSyncQueue(item) {
  const db = await getDB();
  await db.add("syncQueue", {
    ...item,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
}

// Get pending sync items
export async function getPendingSyncItems() {
  const db = await getDB();
  return db.getAllFromIndex("syncQueue", "status", "pending");
}

// Mark sync item as done
export async function markSyncItemDone(id) {
  const db = await getDB();
  const item = await db.get("syncQueue", id);
  if (item) {
    await db.put("syncQueue", { ...item, status: "done" });
  }
}

// Mark document as synced
export async function markDocumentSynced(id) {
  const db = await getDB();
  const doc = await db.get("documents", id);
  if (doc) {
    await db.put("documents", { ...doc, synced: true });
  }
}