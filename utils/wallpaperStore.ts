// Wallpaper storage using IndexedDB to handle large images (4K) safely.
// Provides simple APIs to save, list, fetch, and delete wallpapers.

const DB_NAME = 'glassy-wallpapers';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

const hasIndexedDB = typeof indexedDB !== 'undefined';

export interface StoredWallpaper {
  id: string;
  name: string;
  createdAt: number;
}

export interface WallpaperWithURL extends StoredWallpaper {
  url: string; // object URL for rendering/downloading
}

function openDB(): Promise<IDBDatabase> {
  if (!hasIndexedDB) return Promise.reject(new Error('IndexedDB is not available in this environment'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStore(mode: IDBTransactionMode = 'readonly') {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  return { tx, store };
}

export async function saveWallpaper(blob: Blob, name: string): Promise<WallpaperWithURL> {
  if (!hasIndexedDB) throw new Error('IndexedDB not available');
  const { tx, store } = await getStore('readwrite');
  const id = crypto.randomUUID();
  const record: StoredWallpaper = { id, name, createdAt: Date.now() };

  await new Promise<void>((resolve, reject) => {
    const putReq = store.put({ ...record, blob });
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });

  return { ...record, url: URL.createObjectURL(blob) };
}

export async function listWallpapers(): Promise<WallpaperWithURL[]> {
  if (!hasIndexedDB) return [];
  const { tx, store } = await getStore('readonly');
  const req = store.getAll();
  const result = await new Promise<any[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as any[]);
    req.onerror = () => reject(req.error);
  });

  return result
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .map((item) => {
      return {
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        url: URL.createObjectURL(item.blob as Blob),
      } as WallpaperWithURL;
    });
}

export async function deleteWallpaper(id: string): Promise<void> {
  if (!hasIndexedDB) return;
  const { store } = await getStore('readwrite');
  await new Promise<void>((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getWallpaperBlob(id: string): Promise<Blob | null> {
  if (!hasIndexedDB) return null;
  const { store } = await getStore('readonly');
  const req = store.get(id);
  const result = await new Promise<any>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as any);
    req.onerror = () => reject(req.error);
  });
  return result?.blob ?? null;
}

export async function clearAllWallpapers(): Promise<void> {
  if (!hasIndexedDB) return;
  const { store } = await getStore('readwrite');
  await new Promise<void>((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
