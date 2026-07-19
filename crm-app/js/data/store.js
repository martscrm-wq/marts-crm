import { openDB } from './db.js';
import { generateId } from '../utils/id-generator.js';

function emit(entity, action) {
  window.dispatchEvent(new CustomEvent(`crm:${entity}:${action}`, { detail: { entity, action } }));
}

function txn(storeName, mode) {
  return openDB().then(db => {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  });
}

export async function getAll(entity) {
  const store = await txn(entity, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result.filter(r => !r.isDeleted));
    req.onerror = () => reject(req.error);
  });
}

export async function getById(entity, id) {
  const store = await txn(entity, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function add(entity, record) {
  const id = record.id || generateId(entity);
  const now = new Date().toISOString();
  const full = { ...record, id, createdAt: now, updatedAt: now, isDeleted: false };
  const store = await txn(entity, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(full);
    req.onsuccess = () => { emit(entity, 'updated'); resolve(full); };
    req.onerror = () => reject(req.error);
  });
}

export async function update(entity, id, patch) {
  const store = await txn(entity, 'readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) return reject(new Error('Not found'));
      const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      const putReq = store.put(updated);
      putReq.onsuccess = () => { emit(entity, 'updated'); resolve(updated); };
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function bulkUpdate(entity, ids, patch) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(entity, 'readwrite');
    const store = tx.objectStore(entity);
    ids.forEach(id => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (existing) {
          store.put({ ...existing, ...patch, id, updatedAt: new Date().toISOString() });
        }
      };
    });
    tx.oncomplete = () => { emit(entity, 'updated'); resolve(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function bulkDelete(entity, ids) {
  return bulkUpdate(entity, ids, { isDeleted: true });
}

export async function query(entity, filterFn) {
  const all = await getAll(entity);
  return all.filter(filterFn);
}

export async function cleanupExpiredTrash() {
  const db = await openDB();
  const tx = db.transaction('leads', 'readwrite');
  const store = tx.objectStore('leads');
  const now = new Date().toISOString();
  const allReq = store.getAll();
  allReq.onsuccess = () => {
    allReq.result.forEach(lead => {
      if (lead.isDeleted && lead.expiresAt && lead.expiresAt < now) {
        store.delete(lead.id);
      }
    });
  };
  return new Promise(resolve => { tx.oncomplete = () => resolve(); });
}
