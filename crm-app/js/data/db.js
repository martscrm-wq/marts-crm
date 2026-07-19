const DB_NAME = 'crm_db';
const DB_VERSION = 1;

let dbInstance = null;

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('leads')) {
        const leadStore = db.createObjectStore('leads', { keyPath: 'id' });
        leadStore.createIndex('rating', 'rating', { unique: false });
        leadStore.createIndex('stage', 'stage', { unique: false });
        leadStore.createIndex('assignedTo', 'assignedTo', { unique: false });
        leadStore.createIndex('source', 'source', { unique: false });
        leadStore.createIndex('createdDate', 'createdDate', { unique: false });
      }
      if (!db.objectStoreNames.contains('deals')) {
        const dealStore = db.createObjectStore('deals', { keyPath: 'id' });
        dealStore.createIndex('leadId', 'leadId', { unique: false });
        dealStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('campaigns')) {
        db.createObjectStore('campaigns', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('units')) {
        const unitStore = db.createObjectStore('units', { keyPath: 'id' });
        unitStore.createIndex('publishUrl', 'publishUrl', { unique: false });
        unitStore.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains('bulkHistory')) {
        db.createObjectStore('bulkHistory', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}
