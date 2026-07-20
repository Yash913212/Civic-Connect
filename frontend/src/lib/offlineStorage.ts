const OFFLINE_DB_NAME = "nagara-netra-offline";
const OFFLINE_STORE = "pending-complaints";
const DB_VERSION = 1;

// Type declaration for SyncManager (not yet in TypeScript lib)
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
        db.createObjectStore(OFFLINE_STORE, { keyPath: "tempId" });
      }
    };
  });
}

export interface OfflineComplaint {
  tempId: string;
  title: string;
  description: string;
  location: string;
  latitude?: string;
  longitude?: string;
  address?: string;
  department: string;
  priority: string;
  image_url?: string;
  ai_summary?: string;
  ai_request_letter?: string;
  token: string;
  createdAt: string;
}

export async function saveComplaintOffline(complaint: Omit<OfflineComplaint, "tempId" | "createdAt">): Promise<string> {
  const tempId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_STORE, "readwrite");
  const store = tx.objectStore(OFFLINE_STORE);
  
  const record: OfflineComplaint = {
    ...complaint,
    tempId,
    createdAt: new Date().toISOString(),
  };
  
  store.add(record);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      // Register for background sync
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
          const syncManager = (registration as ServiceWorkerRegistration & { sync?: SyncManager }).sync;
          if (syncManager) {
            syncManager.register("sync-complaints").catch(console.error);
          }
        });
      }
      resolve(tempId);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getOfflineComplaints(): Promise<OfflineComplaint[]> {
  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_STORE, "readonly");
  const store = tx.objectStore(OFFLINE_STORE);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function removeOfflineComplaint(tempId: string): Promise<void> {
  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_STORE, "readwrite");
  const store = tx.objectStore(OFFLINE_STORE);
  store.delete(tempId);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getOfflineComplaintCount(): Promise<number> {
  const db = await openOfflineDB();
  const tx = db.transaction(OFFLINE_STORE, "readonly");
  const store = tx.objectStore(OFFLINE_STORE);
  const request = store.count();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function registerOnlineListener(callback: () => void): () => void {
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}
