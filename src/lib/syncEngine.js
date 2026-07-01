import {
  getPendingSyncItems,
  markSyncItemDone,
  markDocumentSynced,
} from "./db";

let isSyncing = false;

export async function runSyncEngine() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  isSyncing = true;

  try {
    const pendingItems = await getPendingSyncItems();

    for (const item of pendingItems) {
      try {
        const response = await fetch(`/api/documents/${item.documentId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            content: item.content,
            version: item.version,
          }),
        });

        if (response.ok) {
          await markSyncItemDone(item.id);
          await markDocumentSynced(item.documentId);
        }
      } catch (err) {
        console.error("Sync failed for item:", item.id, err);
      }
    }
  } finally {
    isSyncing = false;
  }
}

export function startSyncEngine() {
  // Sync when coming back online
  window.addEventListener("online", () => {
    runSyncEngine();
  });

  // Sync every 30 seconds
  setInterval(() => {
    if (navigator.onLine) runSyncEngine();
  }, 30000);
}