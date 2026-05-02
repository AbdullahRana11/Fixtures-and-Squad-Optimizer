// Player Photo Storage Utility
// Stores player photos as base64 data URLs in localStorage
// Keyed by player ID — works for both real DB players and custom injected ones

const STORAGE_KEY = 'fpl_player_photos';

function getPhotoStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePhotoStore(store: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Photo storage full, clearing oldest entries');
    // If quota exceeded, clear and retry
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function getPlayerPhoto(playerId: string): string | null {
  const store = getPhotoStore();
  return store[playerId] || null;
}

export function setPlayerPhoto(playerId: string, dataUrl: string): void {
  const store = getPhotoStore();
  store[playerId] = dataUrl;
  savePhotoStore(store);
}

export function removePlayerPhoto(playerId: string): void {
  const store = getPhotoStore();
  delete store[playerId];
  savePhotoStore(store);
}

export function getAllPlayerPhotos(): Record<string, string> {
  return getPhotoStore();
}

/**
 * Compress and resize an image file to a max dimension for efficient localStorage storage.
 * Returns a base64 data URL (JPEG, quality 0.7).
 */
export function compressImage(file: File, maxDim: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        
        // Scale down to maxDim while preserving aspect ratio
        if (w > h) {
          if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        } else {
          if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('Canvas unavailable'); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
