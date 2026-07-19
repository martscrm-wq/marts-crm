// history.js — T211-T213: Bulk action history + undo (REQ-410, REQ-411)
import { openDB } from './db.js';

export async function logBulkAction(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bulkHistory', 'readwrite');
    tx.objectStore('bulkHistory').put(entry);
    tx.oncomplete = async () => {
      const tx2 = db.transaction('bulkHistory', 'readwrite');
      const store = tx2.objectStore('bulkHistory');
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > 50) {
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const sorted = allReq.result.sort((a, b) => (a.performedAt || '').localeCompare(b.performedAt || ''));
            const toDelete = sorted.slice(0, sorted.length - 50);
            toDelete.forEach(item => store.delete(item.id));
          };
        }
        resolve();
      };
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getBulkHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bulkHistory', 'readonly');
    const req = tx.objectStore('bulkHistory').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function undoBulkAction(actionId, store) {
  const db = await openDB();
  const action = await new Promise((resolve, reject) => {
    const tx = db.transaction('bulkHistory', 'readonly');
    const req = tx.objectStore('bulkHistory').get(actionId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!action || action.isUndone) return false;

  const tx2 = db.transaction(store, 'readwrite');
  const objStore = tx2.objectStore(store);
  action.previousState.forEach(state => objStore.put(state));

  return new Promise((resolve) => {
    tx2.oncomplete = async () => {
      action.isUndone = true;
      const tx3 = db.transaction('bulkHistory', 'readwrite');
      tx3.objectStore('bulkHistory').put(action);
      tx3.oncomplete = () => resolve(true);
    };
  });
}
